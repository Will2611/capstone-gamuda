import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { ChatMessage, FoodMatch } from "../../types/foodMatch";

interface ChatRoomProps {
  match: FoodMatch | null;
  messages: ChatMessage[];
  currentUserId?: string;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onPlanDate: () => void;
}

//Format the countdown for the chat
function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Chat expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0)
    return `Chat expires in ${days} day${days !== 1 ? "s" : ""} ${hours} hours`;
  if (hours > 0) return `Chat expires in ${hours} hours ${mins} min`;
  return `Chat expires in ${mins} minutes`;
}

//Chat Room Component
export function ChatRoom({
  match,
  messages,
  currentUserId = "me",
  onClose,
  onSendMessage,
  onPlanDate,
}: ChatRoomProps) {
  const [input, setInput] = useState("");
  const [countdown, setCountdown] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  //Update the countdown for the chat
  useEffect(() => {
    if (!match) return;
    const update = () => setCountdown(formatCountdown(match.chatExpiresAt));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [match]);

  //Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //Check if the chat is expired
  const isExpired = match && new Date(match.chatExpiresAt) <= new Date();

  //Send a message
  const handleSend = () => {
    const text = input.trim();
    if (!text || isExpired) return; //if there is no text or the chat is expired, return
    onSendMessage(text); //send the message
    setInput(""); //reset the input
  };

  return (
    <AnimatePresence>
      {match && ( //if there is a match, show the chat room
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex flex-col bg-white md:max-w-lg  md:rounded-2xl md:shadow-2xl md:border md:border-bs-neutral-200 md:inset-x-4 md:top-[45vh] md:left-[100vh] md:h-[55vh]"
        >
          <div className="flex items-center gap-3 p-4 border-b border-bs-neutral-200 bg-gradient-to-r from-bs-gold/10 to-bs-red/5">
            <img
              src={match.user.avatarUrl}
              alt={match.user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-bs-neutral-900 truncate">
                {match.user.name}
              </h3>
              <p className="text-xs text-bs-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {countdown}
              </p>
            </div>
            <button
              onClick={onPlanDate} //plan the food date
              className="p-2 rounded-lg bg-bs-gold/20 hover:bg-bs-gold/40 transition-colors"
              title="Plan Food Date"
            >
              <Calendar className="w-5 h-5 text-bs-neutral-800" />
            </button>
            <button
              onClick={onClose} //close the chat
              className="p-2 rounded-lg hover:bg-bs-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bs-neutral-100">
            <div className="text-center">
              <span className="text-xs px-3 py-1 rounded-full bg-white text-bs-neutral-500 shadow-sm">
                Temporary chat — meet safely in public places
              </span>
            </div>
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      isMe
                        ? "bg-gradient-to-br from-bs-gold to-[#FFE44D] text-bs-neutral-900 rounded-br-md"
                        : "bg-white text-bs-neutral-800 shadow-sm rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMe ? "text-bs-neutral-700" : "text-bs-neutral-400"
                      }`}
                    >
                      {format(new Date(msg.timestamp), "h:mm a")}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {isExpired ? (
            <div className="p-4 text-center text-sm text-bs-neutral-500 border-t border-bs-neutral-200">
              This chat has expired. Plan your next food adventure elsewhere!
            </div>
          ) : (
            <div className="p-4 border-t border-bs-neutral-200 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-full bg-bs-neutral-100 border border-bs-neutral-200 focus:outline-none focus:border-bs-gold text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-full bg-bs-gold flex items-center justify-center hover:bg-[#FFE44D] transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-bs-neutral-900" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
