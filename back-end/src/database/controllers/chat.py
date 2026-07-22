from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict, Set, Optional
from datetime import datetime
import json
import uuid
from src.database.connection import SessionLocal, db_dependency
from fastapi.responses import HTMLResponse
from src.database.controllers.utils import decode_access_token

router = APIRouter(prefix="/chat", tags=['chat'])

# https://www.digitalocean.com/community/questions/building-real-time-chat-with-room-management-in-fastapi
class RoomConnectionManager:
    def __init__(self):
        # Store active connections by room
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Store user info for each connection
        self.user_info: Dict[WebSocket, dict] = {}
        # Store room members
        self.room_members: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, username: str):
        await websocket.accept()
        # Initialize room if it doesn't exist
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            self.room_members[room_id] = set()

        # Add connection to room
        self.active_connections[room_id].append(websocket)
        self.user_info[websocket] = {
            "user_id": user_id,
            "username": username,
            "room_id": room_id
        }
        self.room_members[room_id].add(username)

        # Notify room about new user
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "username": username,
            "message": f"{username} joined the room",
            "timestamp": datetime.now().isoformat(),
            "room_members": list(self.room_members[room_id])
        })

    def disconnect(self, websocket: WebSocket):
        user_info = self.user_info.pop(websocket, None)
        if not user_info:
            # Empty string is still false for room_id / username checks
            return '', ''

        room_id = user_info["room_id"]
        username = user_info["username"]

        # Remove from connections (safe if already cleaned up as dead)
        if room_id in self.active_connections:
            try:
                self.active_connections[room_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        # Remove from room members
        if room_id in self.room_members:
            self.room_members[room_id].discard(username)
            if not self.room_members[room_id]:
                del self.room_members[room_id]

        return room_id, username

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id not in self.active_connections:
            return

        message_str = json.dumps(message)
        dead_connections = []

        for connection in self.active_connections[room_id]:
            try:
                await connection.send_text(message_str)
            except Exception:
                dead_connections.append(connection)

        # Clean up dead connections
        for dead_conn in dead_connections:
            try:
                self.active_connections[room_id].remove(dead_conn)
            except ValueError:
                pass
            self.user_info.pop(dead_conn, None)
        if room_id in self.active_connections and not self.active_connections[room_id]:
            del self.active_connections[room_id]

room_manager = RoomConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    wSocket: WebSocket,
    room_id: str,
    username: str = "default_user",
    userid: Optional[str] = None,
    token: Optional[str] = Query(default=None),
):
    """
    Chat WebSocket. Prefer ?token=JWT for authenticated connections.
    Falls back to query username/userid for local testing.
    """
    resolved_user_id = userid or str(uuid.uuid4())
    resolved_username = username

    if token:
        try:
            payload = decode_access_token(token)
            resolved_user_id = str(payload.get("sub") or resolved_user_id)
            resolved_username = str(payload.get("email") or username)
        except Exception:
            await wSocket.close(code=4401)
            return

    await room_manager.connect(wSocket, room_id, resolved_user_id, resolved_username)
    try:
        while True:
            data = await wSocket.receive_text()
            message_data = json.loads(data)

            if message_data.get("type") == "chat_message":
                text = message_data.get("message", "")
                # Persist when possible
                try:
                    from src.database.models.chat import ChatMessageModel
                    from uuid import UUID as _UUID

                    db = SessionLocal()
                    try:
                        uid = None
                        try:
                            uid = _UUID(resolved_user_id)
                        except ValueError:
                            uid = None
                        db.add(
                            ChatMessageModel(
                                message=text,
                                room_id=_UUID(room_id),
                                user_id=uid,
                                payloads_stringified=None,
                            )
                        )
                        db.commit()
                    finally:
                        db.close()
                except Exception:
                    pass

                await room_manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "chat_message",
                        "username": resolved_username,
                        "user_id": resolved_user_id,
                        "message": text,
                        "timestamp": datetime.now().isoformat(),
                        "room_id": room_id,
                    },
                )

            elif message_data.get("type") == "typing":
                typing_message = {
                    "type": "typing",
                    "username": resolved_username,
                    "is_typing": message_data.get("is_typing", False),
                }
                for connection in room_manager.active_connections.get(room_id, []):
                    if connection != wSocket:
                        try:
                            await connection.send_text(json.dumps(typing_message))
                        except Exception:
                            pass

    except WebSocketDisconnect:
        room_id, username = room_manager.disconnect(wSocket)
        if room_id and username:
            await room_manager.broadcast_to_room(
                room_id,
                {
                    "type": "user_left",
                    "username": username,
                    "message": f"{username} left the room",
                    "timestamp": datetime.now().isoformat(),
                    "room_members": list(room_manager.room_members.get(room_id, [])),
                },
            )

html ="""
<!DOCTYPE html>
<html>
<head>
    <title>FastAPI WebSocket Chat</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        #messages { border: 1px solid #ccc; height: 400px; overflow-y: scroll; padding: 10px; margin: 10px 0; }
        #messageInput { width: 70%; padding: 10px; }
        #sendButton { width: 25%; padding: 10px; }
        .message { margin: 5px 0; padding: 5px; }
        .system { color: #666; font-style: italic; }
        .user-joined { color: green; }
        .user-left { color: red; }
        #members { background: #f5f5f5; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>FastAPI WebSocket Chat</h1>

    <div>
        <label>Username: <input type="text" id="username" value="User123"></label>
        <label>Room ID: <input type="text" id="roomId" value="general"></label>
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
    </div>

    <div id="members"></div>
    <div id="messages"></div>

    <div>
        <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
        <button onclick="sendMessage()" id="sendButton">Send</button>
    </div>

    <script>
        let ws = null;
        let username = '';
        let roomId = '';

        function connect() {
            username = document.getElementById('username').value;
            roomId = document.getElementById('roomId').value;

            if (!username || !roomId) {
                alert('Please enter username and room ID');
                return;
            }

            ws = new WebSocket(`ws://localhost:8000/chat/ws/${roomId}?username=${username}`);

            ws.onopen = function(event) {
                addMessage('Connected to room: ' + roomId, 'system');
            };

            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };

            ws.onclose = function(event) {
                addMessage('Disconnected from chat', 'system');
            };
        }

        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
            }
        }

        function handleMessage(data) {
            switch(data.type) {
                case 'chat_message':
                    addMessage(`${data.username}: ${data.message}`, 'chat');
                    break;
                case 'user_joined':
                    addMessage(data.message, 'user-joined');
                    updateMembers(data.room_members);
                    break;
                case 'user_left':
                    addMessage(data.message, 'user-left');
                    updateMembers(data.room_members);
                    break;
                case 'system_message':
                    addMessage(`System: ${data.message}`, 'system');
                    break;
                case 'typing':
                    // Handle typing indicators here
                    break;
            }
        }

        function addMessage(message, className) {
            const messages = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.className = `message ${className}`;
            messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            messages.appendChild(messageElement);
            messages.scrollTop = messages.scrollHeight;
        }

        function updateMembers(members) {
            const membersDiv = document.getElementById('members');
            membersDiv.innerHTML = `<strong>Room Members (${members.length}):</strong> ${members.join(', ')}`;
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();

            if (message && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'chat_message',
                    message: message
                }));
                input.value = '';
            }
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
    </script>
</body>
</html>
    """

@router.get("/test")
def test_ws():
    return HTMLResponse(html)