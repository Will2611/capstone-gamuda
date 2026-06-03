import { motion } from "motion/react";
import {
  Heart,
  X,
  Bookmark,
  MapPin,
  Utensils,
  Sparkles,
} from "lucide-react";
import { LOOKING_FOR_LABELS } from "../../data/mockFoodMatch";
import type { MatchUser } from "../../types/foodMatch";

interface MatchCardProps {
  user: MatchUser;
  compatibilityScore: number;
  isSaved: boolean;
  onLike: () => void;
  onPass: () => void;
  onSave: () => void;
  dragDirection?: "left" | "right" | null;
}

export function MatchCard({
  user,
  compatibilityScore,
  isSaved,
  onLike,
  onPass,
  onSave,
  dragDirection,
}: MatchCardProps) {
  const exitX = dragDirection === "left" ? -400 : dragDirection === "right" ? 400 : 0;

  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: 0,
        rotate: dragDirection === "left" ? -8 : dragDirection === "right" ? 8 : 0,
      }}
      exit={{ x: exitX, opacity: 0, rotate: dragDirection === "left" ? -20 : 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative w-full max-w-sm mx-auto"
    >
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border border-bs-neutral-200">
        <div className="relative h-80 sm:h-96">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-bs-gold" />
            <span className="text-sm font-bold text-bs-neutral-900">
              {compatibilityScore}%
            </span>
            <span className="text-xs text-bs-neutral-600">match</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <h2 className="text-2xl font-bold">
              {user.name}, {user.age}
            </h2>
            <p className="text-sm text-white/80 mt-1 line-clamp-2">{user.bio}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-bs-gold/90 text-bs-neutral-900">
              {LOOKING_FOR_LABELS[user.lookingFor]}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-gradient-to-b from-white to-bs-neutral-50">
          <div>
            <p className="text-xs font-medium text-bs-neutral-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Favorite foods
            </p>
            <div className="flex flex-wrap gap-1.5">
              {user.favoriteFoods.map((food) => (
                <span
                  key={food}
                  className="px-2.5 py-1 rounded-full text-xs bg-bs-gold/20 text-bs-neutral-800 border border-bs-gold/30"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-bs-neutral-500 uppercase tracking-wide mb-2">
              Personality
            </p>
            <div className="flex flex-wrap gap-1.5">
              {user.personalityTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs bg-bs-red/10 text-bs-red border border-bs-red/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-bs-neutral-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Favorite spots
            </p>
            <p className="text-sm text-bs-neutral-700">
              {user.favoriteRestaurants.join(" · ")}
            </p>
          </div>

          <div className="w-full h-2 rounded-full bg-bs-neutral-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${compatibilityScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-bs-gold to-bs-red"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPass}
          className="w-14 h-14 rounded-full bg-white border-2 border-bs-neutral-300 flex items-center justify-center shadow-lg hover:border-bs-red hover:text-bs-red transition-colors"
          aria-label="Pass"
        >
          <X className="w-7 h-7" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSave}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors ${
            isSaved
              ? "bg-bs-gold text-bs-neutral-900"
              : "bg-white border-2 border-bs-neutral-300 hover:border-bs-gold"
          }`}
          aria-label="Save"
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLike}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-bs-red to-[#ff6b6b] flex items-center justify-center shadow-xl text-white"
          aria-label="Like"
        >
          <Heart className="w-8 h-8 fill-current" />
        </motion.button>
      </div>
    </motion.div>
  );
}
