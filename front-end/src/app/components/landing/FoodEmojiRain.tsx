import React, { useMemo } from "react";

interface EmojiDrop {
  id: number;
  emoji: string;
  left: number; // percentage 0 - 100
  duration: number; // seconds (5.5s - 9.5s)
  delay: number; // seconds
  size: number; // rem (1.2 - 2.5)
  rotationStart: number; // deg
  rotationEnd: number; // deg
  maxOpacity: number; // 0.3 - 0.7
}

const EMOJI_LIST = [
  "🥭", "🍉", "🍢", "🥤", "🌶️", "🥥", "🍜", "🐟",
  "🌮", "🍕", "🍔", "🍣", "🥟", "🧋", "🍩", "🍧"
];

export const FoodEmojiRain: React.FC = () => {
  // Generate a deterministic or randomized set of drops
  const drops = useMemo<EmojiDrop[]>(() => {
    const totalDrops = 36; // Number of falling emojis
    const items: EmojiDrop[] = [];

    for (let i = 0; i < totalDrops; i++) {
      // Pick emoji sequentially to guarantee all 16 emojis are well-represented
      const emoji = EMOJI_LIST[i % EMOJI_LIST.length];
      
      // Random position from 1% to 98%
      const left = Math.round((Math.random() * 97 + 1) * 10) / 10;
      
      // Speed strictly between 5.5s and 9.5s
      const duration = Math.round((5.5 + Math.random() * 4.0) * 10) / 2;
      
      // Staggered delay (negative delays ensure emojis are immediately present on screen load)
      const delay = Math.round((-Math.random() * duration) * 10) / 10;
      
      // Random font size between 1.4rem and 2.6rem
      const size = Math.round((1.4 + Math.random() * 1.2) * 10) / 10;
      
      // Random rotations
      const rotationStart = Math.floor(Math.random() * 90 - 45);
      const rotationEnd = Math.floor(rotationStart + (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360));
      
      // Random max opacity for depth effect
      const maxOpacity = Math.round((0.35 + Math.random() * 0.45) * 100) / 100;

      items.push({
        id: i,
        emoji,
        left,
        duration,
        delay,
        size,
        rotationStart,
        rotationEnd,
        maxOpacity,
      });
    }

    return items;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 8%, rgba(0,0,0,0.85) 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 8%, rgba(0,0,0,0.85) 90%, transparent 100%)",
      }}
    >
      <style>{`
        @keyframes foodEmojiFall {
          0% {
            transform: translateY(-10vh) rotate(var(--rot-start));
            opacity: 0;
          }
          12% {
            opacity: var(--max-op);
          }
          88% {
            opacity: var(--max-op);
          }
          100% {
            transform: translateY(105vh) rotate(var(--rot-end));
            opacity: 0;
          }
        }

        .food-emoji-drop {
          animation: foodEmojiFall linear infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {drops.map((drop) => (
        <span
          key={drop.id}
          className="food-emoji-drop absolute top-0 inline-block"
          style={
            {
              left: `${drop.left}%`,
              fontSize: `${drop.size}rem`,
              animationDuration: `${drop.duration}s`,
              animationDelay: `${drop.delay}s`,
              "--rot-start": `${drop.rotationStart}deg`,
              "--rot-end": `${drop.rotationEnd}deg`,
              "--max-op": drop.maxOpacity,
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))",
            } as React.CSSProperties
          }
        >
          {drop.emoji}
        </span>
      ))}
    </div>
  );
};
