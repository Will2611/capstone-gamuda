import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { X, Heart } from "lucide-react";
import type { FoodMatch } from "../../types/foodMatch";
import { getSharedInterestMessage } from "../../data/mockFoodMatch";
import { Button } from "../Button";

interface MatchModalProps {
  match: FoodMatch | null;
  currentUserAvatar?: string;
  onClose: () => void;
  onStartChat: () => void;
}


export function MatchModal({
  match,
  currentUserAvatar,
  onClose,
  onStartChat,
}: MatchModalProps) {
  //Show confetti when a match is found
  useEffect(() => {
    if (!match) return;
    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#FFD700", "#FF4C4C", "#FFE44D"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#FFD700", "#FF4C4C", "#FFE44D"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [match]);

  const message = match
    ? getSharedInterestMessage(match.sharedInterests)
    : "";

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="bg-gradient-to-br from-bs-gold via-[#FFE44D] to-bs-red p-8 text-center relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-bs-neutral-900" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/30 mb-4"
              >
                <Heart className="w-8 h-8 text-bs-red fill-bs-red" />
              </motion.div>

              <h2 className="text-3xl font-bold text-bs-neutral-900 mb-2">
                It&apos;s a Match!
              </h2>
              <p className="text-bs-neutral-800 text-sm">
                You and {match.user.name} share great taste
              </p>
            </div>

            <div className="bg-white p-6">
              <div className="flex items-center justify-center -mt-12 mb-4">
                <div className="flex -space-x-4">
                  <img
                    src={
                      currentUserAvatar ??
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                    }
                    alt="You"
                    className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                  <img
                    src={match.user.avatarUrl}
                    alt={match.user.name}
                    className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                </div>
              </div>

              <p className="text-center text-bs-neutral-700 mb-4 italic">
                &ldquo;{message}&rdquo;
              </p>

              {match.sharedInterests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {match.sharedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full text-xs bg-bs-gold/20 text-bs-neutral-800 border border-bs-gold/40"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button className="w-full" onClick={onStartChat}>
                  Say Hello
                </Button>
                <button
                  onClick={onClose}
                  className="text-sm text-bs-neutral-500 hover:text-bs-neutral-700 transition-colors"
                >
                  Keep swiping
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
