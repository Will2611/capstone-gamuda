import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "What do you feel like eating today?",
};

const DUMMY_RESPONSES = [
  "Based on your cravings, I'd suggest trying Spice Haven — great spicy noodles nearby!",
  "How about Italian? Pasta Paradise has excellent gluten-free options.",
  "For something quick, Taco Fiesta is only 8–12 minutes away.",
  "Sushi Supreme is perfect if you're in the mood for Japanese tonight.",
  "Tell me more about your dietary needs and I'll narrow it down!",
];

export function ChatbotPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply =
        DUMMY_RESPONSES[Math.floor(Math.random() * DUMMY_RESPONSES.length)];
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-bs-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-bs-neutral-200 bg-gradient-to-r from-bs-gold/15 to-bs-blue/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-bs-gold/30">
            <Bot size={20} className="text-bs-neutral-900" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-bs-neutral-900">
              BiteScouts AI
            </h3>
            <p className="text-xs text-bs-neutral-600">
              Your dining discovery assistant
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] md:max-h-none"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === "assistant"
                  ? "bg-bs-gold/30"
                  : "bg-bs-blue/20"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-bs-neutral-100 text-bs-neutral-800 rounded-tl-sm"
                  : "bg-bs-gold text-bs-neutral-900 rounded-tr-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-bs-gold/30 flex items-center justify-center">
              <Bot size={16} />
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
        className="p-3 border-t border-bs-neutral-200 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about food, cuisine, mood..."
          className="flex-1 px-4 py-2.5 rounded-lg border-2 border-bs-neutral-300 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20 outline-none text-sm"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="p-2.5 rounded-lg bg-bs-gold text-bs-neutral-900 hover:bg-[#FFE44D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
