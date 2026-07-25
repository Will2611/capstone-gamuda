import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPinButton } from "../components/MapPin";
import ChatBoxPanel from "../components/ChatBoxPanel";
// import { ChatbotPanel } from "../components/ChatbotPanel";
import { RestaurantPopupCard } from "../components/RestaurantPopupCard";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Skeleton } from "../components/ui/skeleton";
import { MAP_DEFAULT_CENTER, MOCK_RESTAURANTS } from "../data/mockRestaurants";
import { useUser } from "../context/UserContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRestaurantMap } from "../hooks/useRestaurantMap";
import { getSentiment, type Sentiment } from "../services/visibilityApi";
import { trackVisit } from "../services/trackersApi";
import type { Restaurant, SearchPreferences } from "../types/restaurant";
import { mockPromotions } from "../data/mockPromotions";
import PersonPin from "@/assets/person-circle-pin.svg?react";
import FilterBar from "../components/FilterBar";

const emptyForm: SearchPreferences = {
  cuisine: [],
  priceRange: [],
  dietary: [],
  distance: "",
  ambience: [],
  time: "",
};

type ViewMode = "map" | "suggestions";

export default function MapInterface() {
  const { toggleFavorite, isFavorite, profile } = useUser();

  const [filters, setFilters] = useState<SearchPreferences>(emptyForm);

  useEffect(() => {
    if (profile?.savedPreferences) {
      const saved = profile.savedPreferences;
      setFilters({
        cuisine: Array.isArray(saved.cuisine)
          ? saved.cuisine
          : saved.cuisine
            ? [saved.cuisine]
            : [],
        priceRange: Array.isArray(saved.priceRange)
          ? saved.priceRange
          : saved.priceRange
            ? [saved.priceRange]
            : [],
        dietary: Array.isArray(saved.dietary)
          ? saved.dietary
          : saved.dietary
            ? [saved.dietary]
            : [],
        distance: typeof saved.distance === "string" ? saved.distance : "",
        ambience: Array.isArray(saved.ambience)
          ? saved.ambience
          : saved.ambience
            ? [saved.ambience]
            : [],
        time: typeof saved.time === "string" ? saved.time : "",
      });
    }
  }, [profile]);

  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  const [displayedRestaurants, setDisplayedRestaurants] = useState<
    Restaurant[]
  >(() =>
    MOCK_RESTAURANTS.map((restaurant) => ({
      ...restaurant,
      promotions: mockPromotions.filter((promo) => promo.id === restaurant.id),
    })),
  );
  type SuggestedRestaurant = Restaurant & { description: string };

  // Randomizer useMemo
  function getRandomRestaurants<T>(items: T[], count: number) {
    return [...items].sort(() => Math.random() - 0.5).slice(0, count);
  }

  const handleLlmResponse = useCallback(
    (_replyText: string, searchResults: any[]) => {
      if (searchResults && searchResults.length > 0) {
        const withIds = searchResults.filter(
          (r) => r?.id != null && String(r.id).trim() !== "",
        );
        if (withIds.length === 0) return;

        const topIndex = withIds.reduce((bestIdx, r, i, arr) => {
          const rating = r.rating ?? 4.0;
          const bestRating = arr[bestIdx].rating ?? 4.0;
          return rating > bestRating ? i : bestIdx;
        }, 0);

        const mapped = withIds.map((r, index) => {
          // Keep real DB UUID so Get Directions → trackers works.
          // Default mock pins ("1","2",…) are unchanged when chat has no results.
          const restaurantId = String(r.id);
          const rating = r.rating || 4.0;
          const mockMatch = MOCK_RESTAURANTS.find(
            (m) => m.name.toLowerCase() === String(r.name || "").toLowerCase(),
          );
          return {
            id: restaurantId,
            name: r.name,
            rating,
            cuisine: r.cuisine || "Any",
            distance:
              r.distance !== undefined
                ? `${r.distance.toFixed(1)} km`
                : mockMatch?.distance || "1.2 km",
            dietary: mockMatch?.dietary || "Halal",
            isOpen: mockMatch?.isOpen !== undefined ? mockMatch.isOpen : true,
            type: index === topIndex ? ("gold" as const) : ("red" as const),
            coordinates:
              r.longitude && r.latitude
                ? [r.longitude, r.latitude]
                : mockMatch?.coordinates || [101.71, 3.15],
            image: mockMatch?.image,
            images: mockMatch?.images,
            promotions: mockPromotions.filter(
              (promo) =>
                promo.id === restaurantId || promo.id === mockMatch?.id,
            ),
          } as Restaurant;
        });
        setDisplayedRestaurants(mapped);
      } else {
        setDisplayedRestaurants(
          MOCK_RESTAURANTS.map((restaurant) => ({
            ...restaurant,
            promotions: mockPromotions.filter(
              (promo) => promo.id === restaurant.id,
            ),
          })),
        );
      }
    },
    [],
  );

  const filteredRestaurants = useMemo(() => {
    return displayedRestaurants.filter((restaurant) => {
      if (filters.cuisine && filters.cuisine.length > 0) {
        const rCuisine = restaurant.cuisine?.toLowerCase() || "";
        const hasCuisine = filters.cuisine.some((c) =>
          rCuisine.includes(c.toLowerCase()),
        );
        if (!hasCuisine) return false;
      }

      if (filters.priceRange && filters.priceRange.length > 0) {
        if (
          (restaurant as any).priceRange &&
          !filters.priceRange.includes((restaurant as any).priceRange)
        ) {
          return false;
        }
      }

      if (
        filters.dietary &&
        filters.dietary.length > 0 &&
        !filters.dietary.includes("none")
      ) {
        const rDietary = restaurant.dietary?.toLowerCase() || "";
        const hasDietary = filters.dietary.some((d) =>
          rDietary.includes(d.toLowerCase()),
        );
        if (!hasDietary) return false;
      }

      if (filters.ambience && filters.ambience.length > 0) {
        const rAmbience = (restaurant as any).ambience?.toLowerCase() || "";
        const hasAmbience = filters.ambience.some((a) =>
          rAmbience.includes(a.toLowerCase()),
        );
        if (!hasAmbience) return false;
      }

      if (filters.distance) {
        const maxDistance = parseFloat(filters.distance);
        const currentDistance = parseFloat(restaurant.distance || "0");
        if (
          !isNaN(maxDistance) &&
          !isNaN(currentDistance) &&
          currentDistance > maxDistance
        ) {
          return false;
        }
      }

      if (filters.time) {
        const rTime = (restaurant as any).time?.toLowerCase() || "";
        if (rTime && !rTime.includes(filters.time.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [displayedRestaurants, filters]);

  const restaurants = filteredRestaurants;

  const suggestions = useMemo<SuggestedRestaurant[]>(
    () =>
      restaurants.map((restaurant) => ({
        ...restaurant,
        description: `${restaurant.cuisine} cuisine with ${restaurant.dietary.toLowerCase()} and a welcoming atmosphere. It is a strong pick if you want a memorable meal nearby.`,
      })),
    [restaurants],
  );

  const [suggestionResults, setSuggestionResults] = useState<
    SuggestedRestaurant[]
  >(() => getRandomRestaurants(suggestions, 3));
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);

  useEffect(() => {
    setSuggestionResults(getRandomRestaurants(suggestions, 3));
  }, [suggestions]);

  const visibleSuggestions = suggestionResults.length
    ? suggestionResults
    : suggestions.slice(0, 3);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedPin);

  const handlePinClick = useCallback((id: string) => {
    setSelectedPin((current) => (current === id ? null : id));
  }, []);

  const handleMapBackgroundClick = useCallback(() => {
    setSelectedPin(null);
  }, []);

  const handleDirections = useCallback((restaurant: Restaurant) => {
    // End-to-end: Visit → trackers → nightly job → foot_traffic_hourly → chart
    trackVisit(restaurant.id);
    const [lng, lat] = restaurant.coordinates;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank",
    );
  }, []);

  const handleSuggestionSelect = useCallback((restaurant: Restaurant) => {
    setSelectedPin(restaurant.id);
    setViewMode("map");
  }, []);

  useEffect(() => {
    if (!selectedRestaurant) {
      setSentiment(null);
      setSentimentLoading(false);
      setSentimentError(null);
      return;
    }

    let cancelled = false;
    setSentimentLoading(true);
    setSentimentError(null);

    getSentiment(selectedRestaurant.id)
      .then((data) => {
        if (!cancelled) setSentiment(data);
      })
      .catch(() => {
        if (!cancelled) setSentimentError("Failed to load sentiment data");
      })
      .finally(() => {
        if (!cancelled) setSentimentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRestaurant]);

  const {
    userCenter,
    locate,
    isLocating,
    error: geoError,
  } = useGeolocation(MAP_DEFAULT_CENTER);

  const { isLoading, mountAndUnmount } = useRestaurantMap({
    restaurants,
    selectedPin,
    onPinClick: handlePinClick,
    onMapBackgroundClick: handleMapBackgroundClick,
    userCenter,
  });
  // Dual mode
  return (
    <div className="flex flex-col h-[calc(100vh-73px)] bg-bs-neutral-100 gap-0 md:gap-4 md:p-4">
      <div className="px-4 pt-4 md:px-0 md:pt-0 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-bs-neutral-900">
            Dining Discovery
          </h2>
          <p className="text-sm text-bs-neutral-600">
            Explore your cuisine between a live map and curated restaurant
            suggestions.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-white p-1 shadow-sm border border-bs-neutral-200">
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "map"
                ? "bg-bs-gold text-bs-neutral-900"
                : "text-bs-neutral-600 hover:text-bs-neutral-900"
            }`}
          >
            Map Mode
          </button>
          <button
            type="button"
            onClick={() => setViewMode("suggestions")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "suggestions"
                ? "bg-bs-gold text-bs-neutral-900"
                : "text-bs-neutral-600 hover:text-bs-neutral-900"
            }`}
          >
            Suggestion Mode
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-0 md:gap-4">
        <div className="flex-1 relative h-full min-h-[45vh] md:min-h-0 rounded-none md:rounded-xl overflow-hidden border-0 md:border border-bs-neutral-200 shadow-md md:shadow-lg bg-white">
          {viewMode === "map" ? (
            <>
              <FilterBar filters={filters} onFilterChange={setFilters} />
              <div
                ref={mountAndUnmount}
                className="absolute inset-0 w-full h-full"
                aria-label="Restaurant map"
              />

              {isLoading && (
                <div className="absolute inset-0 z-30 bg-bs-neutral-100">
                  <Skeleton className="w-full h-full rounded-none" />
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-4 right-4 pointer-events-auto bg-white rounded-xl p-4 shadow-lg border border-bs-neutral-200 z-10">
                  <h4 className="text-sm font-medium mb-2">Legend</h4>
                  <div className="flex items-center gap-2 mb-1.5 text-sm text-bs-neutral-700">
                    <MapPinButton type="gold" />
                    <span>Top Match</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-bs-neutral-700">
                    <MapPinButton type="red" />
                    <span>Alternatives</span>
                  </div>
                </div>

                {!selectedRestaurant && (
                  <div className="hidden md:flex absolute mt-16 top-4 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2">
                    <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-md text-sm text-bs-neutral-600 border border-bs-neutral-200">
                      Tap a pin to view restaurant details
                    </div>

                    {geoError && (
                      <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs border border-red-200">
                        {geoError}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={locate}
                  disabled={isLocating}
                  aria-label="Locate me on the map"
                  className="absolute top-25 right-10 z-10 pointer-events-auto bg-white rounded-lg p-2.5 shadow-md border border-bs-neutral-200 text-bs-neutral-700 hover:bg-bs-neutral-50 disabled:opacity-60"
                >
                  <PersonPin />
                </button>
              </div>

              {selectedRestaurant && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="pointer-events-auto">
                    <RestaurantPopupCard
                      restaurant={selectedRestaurant}
                      isFavorite={isFavorite(selectedRestaurant.id)}
                      sentiment={sentiment}
                      sentimentLoading={sentimentLoading}
                      sentimentError={sentimentError}
                      onClose={() => setSelectedPin(null)}
                      onToggleFavorite={() =>
                        toggleFavorite(selectedRestaurant)
                      }
                      onDirections={() => handleDirections(selectedRestaurant)}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full overflow-y-auto p-4 md:p-6">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-bs-neutral-900">
                    Suggested restaurants
                  </h3>
                  <p className="text-sm text-bs-neutral-600">
                    Browse suggested restaurants near you with photos,
                    descriptions, and quick actions.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setSuggestionResults(getRandomRestaurants(suggestions, 3))
                  }
                >
                  Surprise me!
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleSuggestions.map((restaurant) => (
                  <Card
                    key={restaurant.id}
                    hover
                    className="overflow-hidden p-0"
                  >
                    {restaurant.image && (
                      <div className="h-36 bg-bs-neutral-200 overflow-hidden">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-bs-neutral-900">
                            {restaurant.name}
                          </h4>
                          <p className="text-sm text-bs-neutral-500">
                            {restaurant.cuisine}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-bs-gold/20 px-3 py-1 text-sm font-medium text-bs-neutral-900">
                          {restaurant.rating.toFixed(1)} ★
                        </span>
                      </div>

                      <p className="text-sm text-bs-neutral-700 mb-4">
                        {restaurant.description}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs text-bs-neutral-600 mb-4">
                        <span className="rounded-full bg-bs-neutral-100 px-2.5 py-1">
                          {restaurant.distance}
                        </span>
                        <span className="rounded-full bg-bs-neutral-100 px-2.5 py-1">
                          {restaurant.dietary}
                        </span>
                        <span className="rounded-full bg-bs-neutral-100 px-2.5 py-1">
                          {restaurant.isOpen ? "Open now" : "Closed"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSuggestionSelect(restaurant)}
                          className="flex-1 min-w-[120px] rounded-lg bg-bs-gold px-3 py-2 text-sm font-medium text-bs-neutral-900 transition-colors hover:bg-[#FFE44D]"
                        >
                          View on Map
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDirections(restaurant)}
                          className="flex-1 min-w-[120px] rounded-lg border border-bs-neutral-200 bg-white px-3 py-2 text-sm font-medium text-bs-neutral-700 transition-colors hover:bg-bs-neutral-50"
                        >
                          Directions
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={locate}
            disabled={isLocating}
            aria-label="Locate me on the map"
            className="absolute top-25 right-10 z-10 pointer-events-auto bg-white rounded-lg p-2.5 shadow-md border border-bs-neutral-200 text-bs-neutral-700 hover:bg-bs-neutral-50 disabled:opacity-60"
          >
            <PersonPin />
          </button>
        </div>

        <div className="w-full md:w-80 xl:w-96 shrink-0 flex flex-col p-4 md:pb-4 min-h-[320px] max-h-[55vh] md:min-h-0 md:max-h-[80vh] overflow-y-hidden">
          <ChatBoxPanel
            socketUrl={null}
            useLlm
            onLlmResponse={handleLlmResponse}
            latitude={userCenter ? userCenter[1] : undefined}
            longitude={userCenter ? userCenter[0] : undefined}
            dummyChat={{
              chatGroupName: "BiteScouts AI",
              chatCaption: "Your dining discovery assistant",
              messages: [
                {
                  id: crypto.randomUUID(),
                  userName: "ChatBot",
                  userType: "bot",
                  userId: "-1",
                  timestamp: new Date(),
                  message: "What do you feel like eating today?",
                },
              ],
              participants: [
                {
                  displayName: "ChatBot",
                  id: "-1",
                  type: "bot",
                  dummyResponses: [],
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}
