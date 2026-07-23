import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock } from "lucide-react";
import type { FoodMatch } from "../../types/foodMatch";
import { Button } from "../Button";

interface AvailabilityModalProps {
  match: FoodMatch | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    available_date: string;
    start_time: string;
    end_time: string;
  }) => void;
}

function toTimeInput(value: string) {
  // HH:MM
  return value.length === 5 ? value : value.slice(0, 5);
}

export function AvailabilityModal({
  match,
  isOpen,
  isSubmitting = false,
  error,
  onClose,
  onSubmit,
}: AvailabilityModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("19:00");

  const handleSubmit = () => {
    if (!date || !startTime || !endTime) return;
    onSubmit({
      available_date: date,
      start_time: `${toTimeInput(startTime)}:00`,
      end_time: `${toTimeInput(endTime)}:00`,
    });
  };

  const valid =
    Boolean(date) &&
    Boolean(startTime) &&
    Boolean(endTime) &&
    toTimeInput(endTime) > toTimeInput(startTime);

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
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
          >
            <div className="sticky top-0 bg-gradient-to-r from-bs-gold/20 to-bs-red/10 p-5 border-b border-bs-neutral-200 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-bs-neutral-900">
                  Plan Food Date
                </h2>
                <p className="text-sm text-bs-neutral-600">
                  When are you free with {match.user.name}?
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <section>
                <label className="text-sm font-medium text-bs-neutral-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border border-bs-neutral-200 focus:outline-none focus:border-bs-gold"
                />
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-bs-neutral-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Start
                  </label>
                  <input
                    type="time"
                    value={toTimeInput(startTime)}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-bs-neutral-200 focus:outline-none focus:border-bs-gold"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-bs-neutral-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> End
                  </label>
                  <input
                    type="time"
                    value={toTimeInput(endTime)}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-bs-neutral-200 focus:outline-none focus:border-bs-gold"
                  />
                </div>
              </section>

              {error && (
                <p className="text-sm text-bs-red bg-bs-red/10 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!valid || isSubmitting}
                >
                  {isSubmitting ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
