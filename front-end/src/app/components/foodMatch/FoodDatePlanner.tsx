import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, Utensils, MessageSquare } from "lucide-react";
import type { FoodMatch } from "../../types/foodMatch";
import { getRestaurantsForSharedInterests } from "../../data/mockFoodMatch";
import { RestaurantSuggestionCard } from "./RestaurantSuggestionCard";
import { Button } from "../Button";

interface FoodDatePlannerProps {
  match: FoodMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

const CUISINE_OPTIONS = [
  "Japanese",
  "Korean",
  "Italian",
  "Cafe",
  "Hotpot",
  "Any",
];

const TIME_SLOTS = [
  "12:00 PM",
  "1:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
];

export function FoodDatePlanner({
  match,
  isOpen,
  onClose,
}: FoodDatePlannerProps) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("7:00 PM");
  const [cuisine, setCuisine] = useState("Any");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const restaurants = match
    ? getRestaurantsForSharedInterests(match.sharedInterests)
    : [];

  const handleSubmit = () => {
    if (!selectedRestaurantId || !date) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      setSelectedRestaurantId(null);
      setDate("");
      setMessage("");
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
          >
            <div className="sticky top-0 bg-gradient-to-r from-bs-gold/20 to-bs-red/10 p-5 border-b border-bs-neutral-200 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-bs-neutral-900">
                  Plan Food Date
                </h2>
                <p className="text-sm text-bs-neutral-600">
                  with {match.user.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-5xl mb-4">🍽️</div>
                  <h3 className="text-xl font-bold text-bs-neutral-900">
                    Date request sent!
                  </h3>
                  <p className="text-bs-neutral-600 mt-2">
                    {match.user.name} will get your food date plan.
                  </p>
                </motion.div>
              ) : (
                <>
                  <section>
                    <h3 className="text-sm font-semibold text-bs-neutral-700 mb-3 flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Restaurants you&apos;ll both love
                    </h3>
                    <div className="space-y-2">
                      {restaurants.map((r) => (
                        <RestaurantSuggestionCard
                          key={r.id}
                          restaurant={r}
                          selected={selectedRestaurantId === r.id}
                          onSelect={() => setSelectedRestaurantId(r.id)}
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="text-sm font-medium text-bs-neutral-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Meetup date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 rounded-xl border border-bs-neutral-200 focus:outline-none focus:border-bs-gold"
                    />
                  </section>

                  <section>
                    <label className="text-sm font-medium text-bs-neutral-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Meetup time
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          className={`px-3 py-2 rounded-full text-sm border-2 transition-colors ${
                            time === slot
                              ? "border-bs-gold bg-bs-gold/20"
                              : "border-bs-neutral-200 hover:border-bs-gold/50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="text-sm font-medium text-bs-neutral-700 mb-2">
                      Cuisine category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCuisine(c)}
                          className={`px-3 py-2 rounded-full text-sm border-2 transition-colors ${
                            cuisine === c
                              ? "border-bs-gold bg-bs-gold/20"
                              : "border-bs-neutral-200"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="text-sm font-medium text-bs-neutral-700 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Optional message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Can't wait to try the ramen with you!"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-bs-neutral-200 focus:outline-none focus:border-bs-gold resize-none text-sm"
                    />
                  </section>

                  <p className="text-xs text-bs-neutral-500 text-center">
                    Meet safely in public places. Share plans only when
                    comfortable.
                  </p>

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!selectedRestaurantId || !date}
                  >
                    Send Food Date Plan
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
