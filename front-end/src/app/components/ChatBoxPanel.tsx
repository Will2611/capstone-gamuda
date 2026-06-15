import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SubmitEvent as ReactSubmitEvent } from "react";
import type { ChatBox, ChatMessage, DummyChatBox } from "../types/chat";
import { useUser } from "../context/UserContext";
import { Send, Bot, User } from "lucide-react";
import type { DummyUserProfile, PublicUserProfileData } from "../types/user";

const chatConnection = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
} as const;

export type CHAT_CONNECTION =
  (typeof chatConnection)[keyof typeof chatConnection];

function getAvatar(isBot = true, avatarUrl?: string, displayName?: string) {
  if (isBot) {
    return <Bot size={20} className="text-bs-neutral-900" />;
  }
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={displayName}
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <User size={20} className="text-bs-neutral-900" />
  );
}

export default function ChatBoxPanel({
  socketUrl = null,
  height,
  children,
  dummyChat,
  onSendMessage = (text) => {},
  onReceiveMessage = (text) => {},
}: {
  socketUrl: string | null;
  // has to be inline style because tailwind doesn't generate
  children?: ReactNode;
  height?: string;
  dummyChat?: DummyChatBox;
  chatName?: string;
  onSendMessage?: (text: string) => void;
  onReceiveMessage?: (text: string, id?: string) => void;
}) {
  const getUser = useUser();

  const [socketStatus, setSocketStatus] = useState<CHAT_CONNECTION>(
    chatConnection.DISCONNECTED,
  );

  const [initPayload, setInitPayload] = useState<ChatBox | null>(null);
  const wsRef = useRef<WebSocket>(null);
  // Setting up receiving message
  useEffect(() => {
    if (!socketUrl) {
      return;
    }
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => setSocketStatus(chatConnection.CONNECTED);
    ws.onclose = () => setSocketStatus(chatConnection.DISCONNECTED);
    ws.onerror = () => setSocketStatus(chatConnection.ERROR);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if ((data.type = "init")) {
          setInitPayload(data.payload);
        }
        setMessages((prev) => [...prev, data]);
      } catch {
        setMessages((prev) => [...prev, event.data]);
      }
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [socketUrl]);
  const initChat: ChatBox | DummyChatBox | null = useMemo(() => {
    if (dummyChat) {
      return dummyChat;
    }
    if (initPayload) {
      return initPayload;
    }
    return null;
  }, [dummyChat, initPayload]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expirationCaption, setExpirationCaption] =
    useState<string>("missing caption");
  const [participants, setParticipants] = useState<PublicUserProfileData[]>([]);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [hoursLeft, setHoursLeft] = useState<number>(0);
  const [minsLeft, setMinsLeft] = useState<number>(0);
  const avatarUrlSet = useMemo(() => {
    const kvPair: [string, string | undefined][] = participants.map((v) => {
      return [v.id, v.avatarUrl];
    });
    return new Map(kvPair);
  }, [participants]);
  useEffect(() => {
    if (!initChat) {
      return;
    }
    setMessages(initChat.messages);
    setParticipants((initChat as ChatBox).participants);

    if (initChat.expiresAt) {
      const update = () => {
        const diff = new Date(`${initChat.expiresAt}`).getTime() - Date.now();
        if (diff <= 0) {
          console.log("expired", daysLeft, hoursLeft, minsLeft);
          setDaysLeft(0);
          setHoursLeft(0);
          setMinsLeft(0);
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setDaysLeft(days);
        setHoursLeft(hours);
        setMinsLeft(mins);
      };
      update();
      const interval = setInterval(update, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [initChat]);

  const [dummyUser, setDummyUser] = useState<DummyUserProfile | null>(null);

  useEffect(() => {
    if (daysLeft > 0) {
      setExpirationCaption(
        `Chat expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}`,
      );
    }
  }, [daysLeft, hoursLeft]);
  useEffect(() => {
    if (daysLeft > 0) {
      return;
    }
    if (hoursLeft > 0) {
      setExpirationCaption(
        `Chat expires in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} ${minsLeft} min`,
      );
      return;
    }
    if (minsLeft > 0) {
      setExpirationCaption(
        `Chat expires in ${minsLeft} minute${minsLeft !== 1 ? "s" : ""}`,
      );
      return;
    }
    setExpirationCaption("Chat expired");
  }, [hoursLeft, minsLeft]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Only if there's a dummy user
  useEffect(() => {
    if (!dummyChat) {
      setDummyUser(null);
      return;
    }
    if (!dummyChat.participants[0]) {
      setDummyUser(null);
    } else {
      if (!dummyUser) {
        setDummyUser(dummyChat.participants[0]);
      }
    }
    return () => {};
  }, [dummyChat]);

  const dummyReply = useCallback(() => {
    if (!dummyUser) return null;
    if (dummyUser.dummyResponses.length <= 0) return null;
    const reply =
      dummyUser.dummyResponses[
        Math.floor(Math.random() * dummyUser.dummyResponses.length)
      ];
    return {
      id: crypto.randomUUID(),
      userName: dummyUser.displayName,
      userType: dummyUser.type,
      userId: dummyUser.id,
      timestamp: new Date(),
      message: reply,
    } as ChatMessage;
  }, [dummyUser]);

  useEffect(() => {
    const dummyMessaging = setTimeout(() => {
      if (!dummyUser) {
        return;
      }
      if (
        messages.length > 0 &&
        messages[messages.length - 1].userId === dummyUser.id
      ) {
        return;
      }

      const reply = dummyReply();
      if (!reply) return;
      onReceiveMessage(reply.message, reply.userId);
      setMessages((prev) => [...prev, reply]);
      setIsTyping([]);
    }, 900);
    return () => {
      clearTimeout(dummyMessaging);
    };
  }, [messages]);

  const handleSend = useCallback(
    (e: ReactSubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isTyping.length > 0) return;
      onSendMessage(text);
      // if(!wsRef.current) return
      // wsRef.current.send(text)
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        userName: getUser.profile.displayName,
        userEmail: getUser.profile.email,
        userId: getUser.profile.id,
        userType: "client",
        timestamp: new Date(),
        message: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(["LLM"]);
    },
    [wsRef, input, isTyping],
  );
  return (
    <div
      className={`flex-grow flex flex-col bg-white rounded-xl border border-bs-neutral-200 shadow-lg h-full overflow-hidden md:h-${height}`}
    >
      <div className="px-4 py-3 border-b border-bs-neutral-200 bg-gradient-to-r from-bs-gold/15 to-bs-blue/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-bs-gold/30">
            {initChat?.avatarUrl
              ? getAvatar(false, initChat.avatarUrl, initChat.chatGroupName)
              : getAvatar()}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-bs-neutral-900">
              {initChat?.chatGroupName ?? `Missing Chat`}
            </h3>
            {initChat?.chatCaption && (
              <p className="text-xs text-bs-neutral-600">
                {initChat.chatCaption}
              </p>
            )}
            {initChat?.expiresAt && (
              <p className="text-xs text-bs-neutral-600">{expirationCaption}</p>
            )}
          </div>
          <div>{children}</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-3 ">
        {initChat?.expiresAt && (
          <div className="text-center">
            <span className="text-xs px-3 py-1 rounded-full bg-white text-bs-neutral-500 shadow-sm">
              Temporary chat — meet safely in public places
            </span>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.userId === getUser.profile.id ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.userType === "bot" ? "bg-bs-gold/30" : "bg-bs-blue/20"
              }`}
            >
              {getAvatar(
                msg.userType === "bot",
                avatarUrlSet.get(msg.userId || ""),
                msg.userName,
              )}
            </div>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.userId === getUser.profile.id
                  ? "bg-bs-gold text-bs-neutral-900 rounded-tr-sm"
                  : "bg-bs-neutral-100 text-bs-neutral-800 rounded-tl-sm"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        {isTyping.length > 0 && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-bs-gold/30 flex items-center justify-center">
              {dummyUser &&
                getAvatar(false, dummyUser.avatarUrl, dummyUser.displayName)}
              {/* Change to be for the ws onTyping later */}
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-bs-neutral-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-bs-neutral-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-bs-neutral-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-bs-neutral-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="p-3 border-t border-bs-neutral-200 flex gap-2 min-h-[4em] bottom-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about food, cuisine, mood..."
          className="flex-1 px-4 py-2.5 rounded-lg border-2 border-bs-neutral-300 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 rounded-lg bg-bs-gold text-bs-neutral-900 hover:bg-[#FFE44D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
