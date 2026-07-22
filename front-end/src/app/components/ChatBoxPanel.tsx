import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SubmitEvent as ReactSubmitEvent } from "react";
import type { ChatBox, ChatMessage, DummyChatBox } from "../types/chat";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { Send, Bot, User } from "lucide-react";
import type {
  DummyUserProfile,
  PublicUserProfileData,
  SearchPreferences,
} from "../types/user";
import { sendChatMessage, type RestaurantResult } from "../services/chatbotApi";

/** Backend chat WS chat_message frame */
interface WsChatMessage {
  type: "chat_message";
  message?: string;
  username?: string;
  user_id?: string;
  timestamp?: string;
}

function mapWsChatMessage(data: WsChatMessage): ChatMessage {
  return {
    id: crypto.randomUUID(),
    userId: data.user_id ?? "",
    userName: data.username ?? "User",
    userType: "client",
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    message: data.message ?? "",
  };
}

const chatConnection = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
} as const;

export type CHAT_CONNECTION =
  (typeof chatConnection)[keyof typeof chatConnection];

const RANDOMIZER_CHIP = "Surprise me!";

function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function buildInitialSuggestionChips(
  prefs: Partial<SearchPreferences> | null | undefined,
): string[] {
  const chips: string[] = [];
  const cuisine = (prefs?.cuisine ?? []).filter(Boolean);
  const dietary = (prefs?.dietary ?? []).filter(
    (d) => d && d.toLowerCase() !== "none",
  );
  const ambience = (prefs?.ambience ?? []).filter(Boolean);

  for (const c of cuisine) {
    if (chips.length >= 2) break;
    chips.push(`${titleCase(c)} nearby`);
  }
  for (const d of dietary) {
    if (chips.length >= 2) break;
    chips.push(`${titleCase(d)} options`);
  }
  for (const a of ambience) {
    if (chips.length >= 2) break;
    chips.push(`${titleCase(a)} vibe`);
  }

  while (chips.length < 2) {
    const fallbacks = ["Restaurants near me", "What's good for dinner?"];
    const next = fallbacks[chips.length];
    if (!chips.includes(next)) chips.push(next);
    else break;
  }

  chips.push(RANDOMIZER_CHIP);
  return chips;
}

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
  useLlm = false,
  latitude,
  longitude,
  onSendMessage = (_text) => {},
  onReceiveMessage = (_text) => {},
  onLlmResponse,
}: {
  socketUrl: string | null;
  // has to be inline style because tailwind doesn't generate
  children?: ReactNode;
  height?: string;
  dummyChat?: DummyChatBox;
  useLlm?: boolean;
  latitude?: number;
  longitude?: number;
  chatName?: string;
  onSendMessage?: (text: string) => void;
  onReceiveMessage?: (text: string, id?: string) => void;
  onLlmResponse?: (replyText: string, restaurants: RestaurantResult[]) => void;
}) {
  const getUser = useUser();
  const { user: authUser } = useAuth();
  const selfUserId = authUser?.id ?? getUser.profile.id;

  const [_socketStatus, setSocketStatus] = useState<CHAT_CONNECTION>(
    chatConnection.DISCONNECTED,
  );

  const [initPayload, setInitPayload] = useState<ChatBox | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const wsRef = useRef<WebSocket>(null);
  const pendingWsSendsRef = useRef<string[]>([]);
  const selfUserIdRef = useRef(selfUserId);
  const onReceiveMessageRef = useRef(onReceiveMessage);
  selfUserIdRef.current = selfUserId;
  onReceiveMessageRef.current = onReceiveMessage;

  // Setting up receiving / sending over WebSocket
  useEffect(() => {
    if (!socketUrl) {
      wsRef.current = null;
      pendingWsSendsRef.current = [];
      setSocketStatus(chatConnection.DISCONNECTED);
      return;
    }
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setSocketStatus(chatConnection.CONNECTED);
      const queued = pendingWsSendsRef.current.splice(0);
      for (const text of queued) {
        ws.send(
          JSON.stringify({
            type: "chat_message",
            message: text,
          }),
        );
      }
    };
    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      setSocketStatus(chatConnection.DISCONNECTED);
    };
    ws.onerror = () => setSocketStatus(chatConnection.ERROR);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string;
          message?: string;
          username?: string;
          user_id?: string;
          timestamp?: string;
          is_typing?: boolean;
          payload?: ChatBox;
        };

        if (data.type === "init" && data.payload) {
          setInitPayload(data.payload);
          return;
        }

        if (data.type === "typing") {
          const name = data.username ?? "Someone";
          if (data.is_typing) {
            setIsTyping((prev) =>
              prev.includes(name) ? prev : [...prev, name],
            );
          } else {
            setIsTyping((prev) => prev.filter((n) => n !== name));
          }
          return;
        }

        if (data.type === "chat_message") {
          const mapped = mapWsChatMessage(data as WsChatMessage);
          // Skip echo of our own optimistic send
          if (mapped.userId && mapped.userId === selfUserIdRef.current) {
            return;
          }
          if (!mapped.message.trim()) return;
          onReceiveMessageRef.current(mapped.message, mapped.userId);
          setMessages((prev) => [...prev, mapped]);
          setIsTyping([]);
          return;
        }

        // Ignore system / date-plan events on this socket
      } catch {
        /* ignore malformed frames */
      }
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
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
  const [suggestionChips, setSuggestionChips] = useState<string[]>(() =>
    buildInitialSuggestionChips(getUser.profile.savedPreferences),
  );
  const hasInteractedRef = useRef(false);
  const shownRestaurantIdsRef = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasInteractedRef.current) return;
    setSuggestionChips(
      buildInitialSuggestionChips(getUser.profile.savedPreferences),
    );
  }, [getUser.profile.savedPreferences]);
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
    shownRestaurantIdsRef.current = [];

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
  }, [messages, isTyping, suggestionChips]);

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
    if (useLlm || socketUrl) {
      return;
    }
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
  }, [messages, useLlm, socketUrl, dummyUser, dummyReply, onReceiveMessage]);

  const sendText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isTyping.length > 0) return;
      hasInteractedRef.current = true;
      onSendMessage(text);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        userName: authUser?.displayName ?? getUser.profile.displayName,
        userEmail: authUser?.email ?? getUser.profile.email,
        userId: selfUserId,
        userType: "client",
        timestamp: new Date(),
        message: text,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");

      if (useLlm) {
        const botId = dummyUser?.id ?? "-1";
        const botName = dummyUser?.displayName ?? "ChatBot";
        setIsTyping(["LLM"]);
        try {
          const history = updatedMessages.map((m) => ({
            role:
              m.userType === "bot" || m.userId === botId
                ? ("assistant" as const)
                : ("user" as const),
            content: m.message,
          }));
          const response = await sendChatMessage(
            history,
            latitude,
            longitude,
            shownRestaurantIdsRef.current,
          );
          const replyText = response.message;
          const restaurants = response.restaurants || [];
          // Accumulate IDs so "Other suggestions" can page to the next top 3
          for (const r of restaurants) {
            if (r.id && !shownRestaurantIdsRef.current.includes(r.id)) {
              shownRestaurantIdsRef.current.push(r.id);
            }
          }
          const nextSuggestions = response.suggestions?.length
            ? response.suggestions
            : [RANDOMIZER_CHIP];
          setSuggestionChips(nextSuggestions);
          const botMsg: ChatMessage = {
            id: crypto.randomUUID(),
            userName: botName,
            userType: "bot",
            userId: botId,
            timestamp: new Date(),
            message: replyText,
          };
          onReceiveMessage(replyText, botId);
          if (onLlmResponse) {
            onLlmResponse(replyText, restaurants);
          }
          setMessages((prev) => [...prev, botMsg]);
        } catch {
          const errMsg: ChatMessage = {
            id: crypto.randomUUID(),
            userName: botName,
            userType: "bot",
            userId: botId,
            timestamp: new Date(),
            message:
              "Sorry, I'm having trouble responding right now. Please try again.",
          };
          setSuggestionChips([
            "Restaurants near me",
            "What's good for dinner?",
            RANDOMIZER_CHIP,
          ]);
          setMessages((prev) => [...prev, errMsg]);
        } finally {
          setIsTyping([]);
        }
        return;
      }

      // Live Food Match / peer chat: send over WebSocket
      if (socketUrl) {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "chat_message",
              message: text,
            }),
          );
        } else {
          pendingWsSendsRef.current.push(text);
        }
        return;
      }

      // Offline / mock match: show typing until dummy reply fires
      setIsTyping(["peer"]);
    },
    [
      isTyping,
      messages,
      useLlm,
      socketUrl,
      dummyUser,
      getUser.profile,
      authUser,
      selfUserId,
      onSendMessage,
      onReceiveMessage,
      onLlmResponse,
      latitude,
      longitude,
    ],
  );

  const handleSend = useCallback(
    async (e: ReactSubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      await sendText(input);
    },
    [input, sendText],
  );

  const handleChipClick = useCallback(
    (chip: string) => {
      void sendText(chip);
    },
    [sendText],
  );

  const showSuggestionChips = useLlm && suggestionChips.length > 0;

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
            className={`flex gap-2 ${msg.userId === selfUserId ? "flex-row-reverse" : ""}`}
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
                msg.userId === selfUserId
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

      {showSuggestionChips && (
        <div className="px-3 pb-2 flex flex-wrap gap-2 border-t border-bs-neutral-100 pt-2">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isTyping.length > 0}
              onClick={() => handleChipClick(chip)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                chip === RANDOMIZER_CHIP
                  ? "bg-bs-gold/20 border-bs-gold text-bs-neutral-900 hover:bg-bs-gold/35"
                  : "bg-white border-bs-neutral-200 text-bs-neutral-700 hover:border-bs-gold/50 hover:bg-bs-gold/10"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

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
          disabled={!input.trim() || isTyping.length > 0}
          className="p-2.5 rounded-lg bg-bs-gold text-bs-neutral-900 hover:bg-[#FFE44D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
