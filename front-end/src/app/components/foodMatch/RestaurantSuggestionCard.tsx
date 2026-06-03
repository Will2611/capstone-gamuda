import { motion } from "motion/react";
import { Star, MapPin } from "lucide-react";
import type { SuggestedRestaurant } from "../../types/foodMatch";

interface RestaurantSuggestionCardProps {
  restaurant: SuggestedRestaurant;
  selected: boolean;
  onSelect: () => void;
}

export function RestaurantSuggestionCard({
  restaurant,
  selected,
  onSelect,
}: RestaurantSuggestionCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all ${
        selected
          ? "border-bs-gold shadow-lg ring-2 ring-bs-gold/30"
          : "border-bs-neutral-200 hover:border-bs-gold/50"
      }`}
    >
      <div className="flex gap-3 p-3 bg-white">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-bs-neutral-900 truncate">
            {restaurant.name}
          </h4>
          <p className="text-xs text-bs-neutral-500">{restaurant.cuisine}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-bs-neutral-600">
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-bs-gold text-bs-gold" />
              {restaurant.rating}
            </span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {restaurant.distance}
            </span>
          </div>
          <p className="text-xs text-bs-red mt-1 line-clamp-1">
            {restaurant.matchReason}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
