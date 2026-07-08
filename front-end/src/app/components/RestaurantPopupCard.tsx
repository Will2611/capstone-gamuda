import { useState } from "react";
import {
  X,
  Star,
  MapPin,
  Utensils,
  Heart,
  Navigation,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Restaurant } from "../types/restaurant";
import type { Sentiment } from "../services/visibilityApi";
import { Button } from "./Button";
import Instagram from "@/assets/instagram.svg?react";

import { isPromotionActive } from "../utils/promotionUtils";
import { PromotionPreview } from "./PromotionPreview";

interface RestaurantPopupCardProps {
  restaurant: Restaurant;
  isFavorite: boolean;
  sentiment?: Sentiment | null;
  sentimentLoading?: boolean;
  sentimentError?: string | null;
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
  sentiment,
  sentimentLoading,
  sentimentError,
  onClose,
  onToggleFavorite,
  onDirections,
}: RestaurantPopupCardProps) {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
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
        className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 opacity-100 transition-all duration-300 ease-out translate-y-0 md:absolute md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:w-96 md:-translate-x-0 md:-translate-y-1/2"
        role="dialog"
        aria-labelledby="restaurant-popup-title"
      >
        <div className="rounded-2xl border border-bs-neutral-200 bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
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

          <div className="border-b border-bs-neutral-200 px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-full bg-bs-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveSlide(0)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSlide === 0
                      ? "bg-white text-bs-neutral-900 shadow-sm"
                      : "text-bs-neutral-600 hover:text-bs-neutral-900"
                  }`}
                >
                  Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide(1)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSlide === 1
                      ? "bg-white text-bs-neutral-900 shadow-sm"
                      : "text-bs-neutral-600 hover:text-bs-neutral-900"
                  }`}
                >
                  Sentiment
                </button>
              </div>
              <div className="text-xs font-medium text-bs-neutral-500">
                {activeSlide + 1}/2
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              className="flex w-[200%] transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeSlide * 50}%)` }}
            >
              <div className="w-full space-y-4 p-5 border-r border-bs-neutral-200">
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
                        isFavorite
                          ? "Remove from favorites"
                          : "Save as favorite"
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

              <div className="w-full space-y-4 p-5">
                <div>
                  <h4 className="text-lg font-semibold text-bs-neutral-900">
                    Review Sentiment
                  </h4>
                  <p className="text-sm text-bs-neutral-600">
                    Social visibility sentiment data for this restaurant.
                  </p>
                </div>

                {sentimentLoading ? (
                  <div className="rounded-2xl border border-bs-neutral-200 bg-bs-neutral-50 p-6 text-sm text-bs-neutral-500">
                    Loading sentiment...
                  </div>
                ) : sentimentError ? (
                  <div className="rounded-2xl border border-bs-red/20 bg-red-50 p-6 text-sm text-bs-red-700">
                    {sentimentError}
                  </div>
                ) : sentiment ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-bs-neutral-200 bg-bs-green/5 p-4">
                        <p className="text-sm text-bs-neutral-500">Positive</p>
                        <p className="mt-2 text-3xl font-semibold text-bs-green">
                          {sentiment.positivePct}%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-bs-neutral-200 bg-bs-red/5 p-4">
                        <p className="text-sm text-bs-neutral-500">Negative</p>
                        <p className="mt-2 text-3xl font-semibold text-bs-red">
                          {sentiment.negativePct}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="mt-1 text-sm text-bs-neutral-600">
                        Complaint themes show the most frequent sentiment
                        signals from recent reviews.
                      </div>
                      {sentiment.complaintThemes.map((theme) => (
                        <div
                          key={theme.theme}
                          className="rounded-2xl border border-bs-neutral-200 bg-bs-neutral-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-medium text-bs-neutral-900">
                              {theme.theme}
                            </p>
                            <span className="rounded-full bg-bs-neutral-200 px-2 py-1 text-xs text-bs-neutral-600">
                              {theme.count} mentions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-bs-neutral-200 bg-bs-neutral-50 p-6 text-sm text-bs-neutral-500">
                    Sentiment data is not available for this restaurant yet.
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSlide(0)}
                    disabled={activeSlide === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-bs-neutral-300 bg-white px-4 py-2 text-sm text-bs-neutral-700 transition hover:border-bs-neutral-900 hover:text-bs-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Restaurant
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSlide(1)}
                    disabled={activeSlide === 1}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-bs-neutral-300 bg-white px-4 py-2 text-sm text-bs-neutral-700 transition hover:border-bs-neutral-900 hover:text-bs-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sentiment
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
