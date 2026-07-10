import {
  X,
  Star,
  MapPin,
  Utensils,
  Heart,
  Navigation,
  Play,
} from "lucide-react";
import type { Restaurant } from "../types/restaurant";
import { Button } from "./Button";
import Instagram from "@/assets/instagram.svg?react";

import { isPromotionActive } from "../utils/promotionUtils";
import { PromotionPreview } from "./PromotionPreview";

interface RestaurantPopupCardProps {
  restaurant: Restaurant;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onDirections: () => void;
}

function getTikTokSearchUrl(name: string) {
  return `https://www.tiktok.com/search?q=${encodeURIComponent(name)}`;
}

function getInstagramTagUrl(name: string) {
  return `https://www.instagram.com/explore/tags/${name.replace(/\s+/g, "")}/`;
}

const socialLinkBase =
  "flex w-full items-center justify-center gap-2 rounded-lg border border-bs-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-bs-neutral-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0";

export function RestaurantPopupCard({
  restaurant,
  isFavorite,
  onClose,
  onToggleFavorite,
  onDirections,
}: RestaurantPopupCardProps) {
  const tiktokUrl = getTikTokSearchUrl(restaurant.name);
  const instagramUrl = getInstagramTagUrl(restaurant.name);

  const activePromotions =
    restaurant.promotions?.filter(isPromotionActive) ?? [];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 md:hidden"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="fixed bottom-4 mt-8 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 opacity-100 transition-all duration-300 ease-out translate-y-0 md:absolute md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:w-96 md:-translate-x-0 md:-translate-y-1/2"
        role="dialog"
        aria-labelledby="restaurant-popup-title"
      >
        <div className="rounded-2xl border border-bs-neutral-200 bg-white shadow-2xl max-h-[65vh] overflow-y-auto">
          <div className="relative h-40 bg-bs-neutral-200">
            {restaurant.image ? (
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-bs-gold/30 to-bs-red/20" />
            )}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition-colors duration-200 hover:bg-white hover:shadow-lg"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            {restaurant.type === "gold" && (
              <span className="absolute left-3 top-3 rounded-full bg-bs-gold px-3 py-1 text-xs font-medium text-bs-neutral-900 shadow-sm">
                Top Match
              </span>
            )}
          </div>

          <div className="space-y-4 p-5">
            <div>
              <h3
                id="restaurant-popup-title"
                className="mb-1 text-lg font-semibold text-bs-neutral-900"
              >
                {restaurant.name}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-bs-neutral-600">
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-bs-gold text-bs-gold" />
                  {restaurant.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Utensils size={14} />
                  {restaurant.cuisine}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {restaurant.distance}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  restaurant.isOpen
                    ? "bg-bs-green/15 text-bs-green"
                    : "bg-bs-red/15 text-bs-red"
                }`}
              >
                {restaurant.isOpen ? "Open Now" : "Closed"}
              </span>
              <span className="text-xs text-bs-neutral-500">
                {restaurant.dietary}
              </span>
            </div>

            {/* Actions: stacked on mobile, grid on sm+ */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Button
                  className="flex flex-1 items-center justify-center gap-2 !py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  onClick={onDirections}
                >
                  <Navigation size={16} />
                  Directions
                </Button>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:shrink-0 ${
                    isFavorite
                      ? "border-bs-red bg-bs-red/10 text-bs-red"
                      : "border-bs-neutral-300 text-bs-neutral-700 hover:border-bs-red hover:text-bs-red"
                  }`}
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Save as favorite"
                  }
                >
                  <Heart
                    size={18}
                    className={isFavorite ? "fill-current" : ""}
                  />
                  <span className="text-sm font-medium sm:hidden">
                    {isFavorite ? "Saved" : "Save"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialLinkBase} hover:border-bs-neutral-900 hover:bg-bs-neutral-900 hover:text-white`}
                >
                  <Play size={16} className="shrink-0" />
                  View TikToks
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialLinkBase} hover:border-bs-red hover:bg-bs-red/5 hover:text-bs-red`}
                >
                  <Instagram size={16} />
                  View Instagram
                </a>
              </div>
              {activePromotions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-bs-neutral-900 mb-2">
                    Promotions
                  </h4>

                  {activePromotions.map((promotion) => (
                    <PromotionPreview
                      key={promotion.promoId}
                      promotion={promotion}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
