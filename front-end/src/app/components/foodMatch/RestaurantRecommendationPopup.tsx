import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Star,
  MapPin,
  Clock,
  Wallet,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";
import type { DatePlan } from "../../types/foodMatch";
import type { Promotion } from "../../types/promotion";
import {
  isPromotionActive,
  normalizePromotion,
} from "../../utils/promotionUtils";
import { PromotionPreview } from "../PromotionPreview";
import { PlanProgressIndicator } from "./PlanProgressIndicator";
import { Button } from "../Button";
import { bitescoutApi } from "../../services/baseApi";

interface RestaurantRecommendationPopupProps {
  plan: DatePlan | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onChooseAnother: () => void;
  accepting?: boolean;
  cycling?: boolean;
  currentUserId?: string;
}

export function RestaurantRecommendationPopup({
  plan,
  isOpen,
  onClose,
  onAccept,
  onChooseAnother,
  accepting,
  cycling,
  currentUserId,
}: RestaurantRecommendationPopupProps) {
  const [ideasOpen, setIdeasOpen] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const restaurant = plan?.recommendation;

  useEffect(() => {
    if (!restaurant?.id) return;
    async function fetchPromos() {
      try {
        if (!restaurant?.id) return;
        const { data } = await bitescoutApi.get("/promotions", {
          params: { restaurantId: restaurant.id },
        });
        if (Array.isArray(data)) {
          setPromotions(data.map(normalizePromotion));
        }
        // const res = await fetch(
        //   `http://localhost:8000/promotions?restaurantId=${restaurant.id}`,
        // );
        // if (res.ok) {
        //   const data = await res.json();
        //   if (Array.isArray(data)) {
        //     setPromotions(data.map(normalizePromotion));
        //   }
        // }
      } catch {
        /* ignore fallback */
      }
    }
    fetchPromos();
  }, [restaurant?.id]);

  const activePromos = promotions.filter(isPromotionActive);
  const ideas = plan?.date_ideas;
  const alreadyAccepted = Boolean(
    currentUserId && plan?.accepted_by?.includes(currentUserId),
  );

  if (!plan || !restaurant) return null;

  const photo = restaurant.photos?.[0];
  const price =
    restaurant.price_level != null
      ? "$".repeat(Math.min(4, Math.max(1, restaurant.price_level)))
      : ideas?.estimated_budget || "—";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/55" onClick={onClose} />
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
          >
            <div className="relative h-44 sm:h-52 bg-bs-neutral-200 overflow-hidden">
              {photo ? (
                <img
                  src={photo}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-bs-gold/40 to-bs-red/30 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white/80" />
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/55"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <PlanProgressIndicator status={plan.status} />

              <div>
                <h2 className="text-2xl font-bold text-bs-neutral-900">
                  {restaurant.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-bs-neutral-600">
                  {restaurant.rating != null && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-4 h-4 text-bs-gold fill-bs-gold" />
                      {restaurant.rating.toFixed(1)}
                    </span>
                  )}
                  <span>{restaurant.cuisine || "Restaurant"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Wallet className="w-4 h-4" />
                    {price}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-bs-neutral-50 p-3 flex gap-2">
                  <MapPin className="w-4 h-4 text-bs-red shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-bs-neutral-500">
                      Distance (you)
                    </p>
                    <p className="font-medium">
                      {restaurant.distance_a_km} km · ~
                      {restaurant.travel_time_a_min} min
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-bs-neutral-50 p-3 flex gap-2">
                  <MapPin className="w-4 h-4 text-bs-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-bs-neutral-500">
                      Distance (them)
                    </p>
                    <p className="font-medium">
                      {restaurant.distance_b_km} km · ~
                      {restaurant.travel_time_b_min} min
                    </p>
                  </div>
                </div>
              </div>

              {(restaurant.summary || plan.ranking_reason) && (
                <p className="text-sm text-bs-neutral-700 leading-relaxed">
                  {plan.ranking_reason || restaurant.summary}
                </p>
              )}

              {activePromos.length > 0 && (
                <div className="rounded-2xl border border-bs-neutral-200 bg-bs-neutral-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-bs-red" />
                    <h3 className="font-semibold text-sm text-bs-neutral-900">
                      Active Promotions ({activePromos.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {activePromos.map((promo) => (
                      <PromotionPreview
                        key={promo.promoId || promo.id}
                        promotion={promo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {ideas && (
                <div className="rounded-2xl border border-bs-neutral-200 overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 bg-bs-gold/10"
                    onClick={() => setIdeasOpen((v) => !v)}
                  >
                    <span className="font-semibold text-bs-neutral-900 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      AI First Date Ideas
                      {ideas.vibe && (
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white border border-bs-neutral-200">
                          {ideas.vibe}
                        </span>
                      )}
                    </span>
                    {ideasOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {ideasOpen && (
                    <div className="p-4 space-y-3 text-sm text-bs-neutral-700">
                      <p>{ideas.why_both}</p>
                      <div>
                        <p className="font-medium text-bs-neutral-900 mb-1">
                          Conversation starters
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          {ideas.conversation_starters?.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-bs-neutral-900 mb-1">
                          Ice breakers
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          {ideas.ice_breakers?.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      {ideas.fun_food_challenge && (
                        <p>
                          <span className="font-medium">Fun challenge: </span>
                          {ideas.fun_food_challenge}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-bs-neutral-600 pt-1">
                        {ideas.estimated_budget && (
                          <span className="inline-flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5" />
                            {ideas.estimated_budget}
                          </span>
                        )}
                        {ideas.expected_duration && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {ideas.expected_duration}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {plan.status === "accepted" ? (
                <p className="text-center font-semibold text-bs-green py-2">
                  Plan accepted by both of you!
                </p>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    className="w-full"
                    onClick={onAccept}
                    disabled={accepting || alreadyAccepted}
                  >
                    {alreadyAccepted
                      ? "Waiting for partner to accept…"
                      : accepting
                        ? "Accepting…"
                        : "Accept Plan"}
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={onChooseAnother}
                    disabled={cycling || Boolean(plan.restaurants_exhausted)}
                  >
                    {cycling
                      ? "Finding more…"
                      : plan.restaurants_exhausted
                        ? "No more restaurants nearby"
                        : "Choose Another Restaurant"}
                  </Button>
                  {plan.restaurants_exhausted && plan.message && (
                    <p className="text-xs text-center text-bs-neutral-500 px-2">
                      {plan.message}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-sm text-bs-neutral-500 py-2 hover:text-bs-neutral-800"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
