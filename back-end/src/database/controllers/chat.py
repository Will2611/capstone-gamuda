from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Set
from datetime import datetime
import json
import uuid
from src.database.connection import db_dependency
from fastapi.responses import HTMLResponse

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
        user_info = self.user_info.get(websocket)
        if not user_info:
            # Empy stringis stil false
            return '', ''

        room_id = user_info["room_id"]
        username = user_info["username"]

        # Remove from connections
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

        # Remove from room members
        if room_id in self.room_members:
            self.room_members[room_id].discard(username)

        # Clean up user info
        del self.user_info[websocket]

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
            except:
                dead_connections.append(connection)

        # Clean up dead connections
        for dead_conn in dead_connections:
            self.active_connections[room_id].remove(dead_conn)

room_manager = RoomConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(wSocket: WebSocket, room_id: str,username:str='deafult_user', userid=str(uuid.uuid4())):
    await room_manager.connect(wSocket, room_id,userid,username)
    try:
        while True:
            # Receive message from client
            data = await wSocket.receive_text()
            message_data = json.loads(data)

            # Handle different message types
            if message_data.get("type") == "chat_message":
                # Broadcast chat message to room
                await room_manager.broadcast_to_room(room_id, {
                    "type": "chat_message",
                    "username": username,
                    "user_id": userid,
                    "message": message_data.get("message", ""),
                    "timestamp": datetime.now().isoformat(),
                    "room_id": room_id
                })

            elif message_data.get("type") == "typing":
                # Broadcast typing indicator (exclude sender)
                typing_message = {
                    "type": "typing",
                    "username": username,
                    "is_typing": message_data.get("is_typing", False)
                }

                for connection in room_manager.active_connections.get(room_id, []):
                    if connection != wSocket:  # Don't send to sender
                        try:
                            await connection.send_text(json.dumps(typing_message))
                        except:
                            pass

    except WebSocketDisconnect:
        room_id, username = room_manager.disconnect(wSocket)
        if room_id and username:
            # Notify room about user leaving
            await room_manager.broadcast_to_room(room_id, {
                "type": "user_left",
                "username": username,
                "message": f"{username} left the room",
                "timestamp": datetime.now().isoformat(),
                "room_members": list(room_manager.room_members.get(room_id, []))
            })

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