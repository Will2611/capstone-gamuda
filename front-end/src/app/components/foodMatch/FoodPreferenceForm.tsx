import { motion } from "motion/react";
import {
  FAVORITE_FOOD_OPTIONS,
  PERSONALITY_TAG_OPTIONS,
  BUDGET_OPTIONS,
  DINING_TIME_OPTIONS,
  MEETUP_DISTANCE_OPTIONS,
} from "../../data/mockFoodMatch";
import type { FoodPreferenceProfile } from "../../types/foodMatch";
import { Button } from "../Button";
import { Heart, Sparkles, UtensilsCrossed } from "lucide-react";

interface FoodPreferenceFormProps {
  profile: FoodPreferenceProfile;
  onUpdate: (updates: Partial<FoodPreferenceProfile>) => void;
  onComplete: () => void;
}

function SelectChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
        selected
          ? "bg-gradient-to-r from-bs-gold/30 to-bs-red/20 border-bs-gold text-bs-neutral-900 shadow-md"
          : "bg-white/80 border-bs-neutral-200 text-bs-neutral-700 hover:border-bs-gold/50"
      }`}
    >
      {label}
    </motion.button>
  );
}

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function FoodPreferenceForm({
  profile,
  onUpdate,
  onComplete,
}: FoodPreferenceFormProps) {
  const canSubmit =
    profile.favoriteFoods.length >= 2 && profile.personalityTags.length >= 1;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-bs-gold/20 to-bs-red/10 border border-bs-gold/30 mb-4">
          <Sparkles className="w-4 h-4 text-bs-gold" />
          <span className="text-sm font-medium text-bs-neutral-800">
            Food Match Profile
          </span>
        </div>
        <h1 className="text-3xl font-bold text-bs-neutral-900 mb-2">
          What&apos;s your food vibe?
        </h1>
        <p className="text-bs-neutral-600">
          Help us find people who share your taste -- friends, dates, or food
          buddies.
        </p>
      </motion.div>

      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-bs-neutral-200 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="w-5 h-5 text-bs-red" />
            <h2 className="text-lg font-semibold text-bs-neutral-900">
              Favorite Foods
            </h2>
            <span className="text-xs text-bs-neutral-500">(pick 2+)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FAVORITE_FOOD_OPTIONS.map((food) => (
              <SelectChip
                key={food}
                label={food}
                selected={profile.favoriteFoods.includes(food)}
                onClick={() =>
                  onUpdate({
                    favoriteFoods: toggleInList(profile.favoriteFoods, food),
                  })
                }
              />
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-bs-neutral-200 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-bs-red" />
            <h2 className="text-lg font-semibold text-bs-neutral-900">
              Food Personality
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERSONALITY_TAG_OPTIONS.map((tag) => (
              <SelectChip
                key={tag}
                label={tag}
                selected={profile.personalityTags.includes(tag)}
                onClick={() =>
                  onUpdate({
                    personalityTags: toggleInList(profile.personalityTags, tag),
                  })
                }
              />
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-bs-neutral-200 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-bs-neutral-900 mb-4">
            Dining Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-bs-neutral-600 mb-2 block">
                Budget range
              </label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <SelectChip
                    key={opt.value}
                    label={opt.label}
                    selected={profile.budgetRange === opt.value}
                    onClick={() => onUpdate({ budgetRange: opt.value })}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.halal}
                  onChange={(e) => onUpdate({ halal: e.target.checked })}
                  className="w-4 h-4 rounded accent-bs-gold"
                />
                <span className="text-sm text-bs-neutral-700">
                  Halal preference
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.vegetarian}
                  onChange={(e) => onUpdate({ vegetarian: e.target.checked })}
                  className="w-4 h-4 rounded accent-bs-gold"
                />
                <span className="text-sm text-bs-neutral-700">Vegetarian</span>
              </label>
            </div>

            <div>
              <label className="text-sm text-bs-neutral-600 mb-2 block">
                Preferred dining time
              </label>
              <div className="flex flex-wrap gap-2">
                {DINING_TIME_OPTIONS.map((opt) => (
                  <SelectChip
                    key={opt.value}
                    label={opt.label}
                    selected={profile.preferredDiningTime === opt.value}
                    onClick={() => onUpdate({ preferredDiningTime: opt.value })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-bs-neutral-600 mb-2 block">
                Preferred meetup distance
              </label>
              <div className="flex flex-wrap gap-2">
                {MEETUP_DISTANCE_OPTIONS.map((opt) => (
                  <SelectChip
                    key={opt.value}
                    label={opt.label}
                    selected={profile.meetupDistance === opt.value}
                    onClick={() => onUpdate({ meetupDistance: opt.value })}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <Button
          variant={canSubmit ? "primary" : "disabled"}
          className="w-full"
          onClick={canSubmit ? onComplete : undefined}
          disabled={!canSubmit}
        >
          Start Matching
        </Button>
      </div>
    </div>
  );
}
