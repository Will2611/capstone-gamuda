import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { MapPinButton } from "../components/MapPin";
import ChatBoxPanel from "../components/ChatBoxPanel";
// import { ChatbotPanel } from "../components/ChatbotPanel";
import { RestaurantPopupCard } from "../components/RestaurantPopupCard";
import { Skeleton } from "../components/ui/skeleton";
import { MAP_DEFAULT_CENTER, MOCK_RESTAURANTS } from "../data/mockRestaurants";
import { useUser } from "../context/UserContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRestaurantMap } from "../hooks/useRestaurantMap";
import type { Restaurant } from "../types/restaurant";
import { mockPromotions } from "../data/mockPromotions";
import PersonPin from "@/assets/person-circle-pin.svg?react";

export default function MapInterface() {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useUser();
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  const restaurants = useMemo(
    () =>
      MOCK_RESTAURANTS.map((restaurant) => ({
        ...restaurant,

        promotions: mockPromotions.filter(
          (promo) => promo.id === restaurant.id,
        ),
      })),
    [],
  );
  const selectedRestaurant = restaurants.find((r) => r.id === selectedPin);

  const handlePinClick = useCallback((id: number) => {
    setSelectedPin((current) => (current === id ? null : id));
  }, []);

  const handleMapBackgroundClick = useCallback(() => {
    setSelectedPin(null);
  }, []);

  const handleDirections = useCallback((restaurant: Restaurant) => {
    const [lng, lat] = restaurant.coordinates;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank",
    );
  }, []);

  const { userCenter, locate, isLocating, error: geoError } =
    useGeolocation(MAP_DEFAULT_CENTER);

  const { mapContainerRef, isLoading } = useRestaurantMap({
    restaurants,
    selectedPin,
    onPinClick: handlePinClick,
    onMapBackgroundClick: handleMapBackgroundClick,
    userCenter,
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] bg-bs-neutral-100 gap-0 lg:gap-4 lg:p-4 overflow-hidden">
      <div className="flex-1 relative min-h-[45vh] lg:min-h-0 rounded-none lg:rounded-xl overflow-hidden border-0 lg:border border-bs-neutral-200 shadow-md lg:shadow-lg">
        <div
          ref={mapContainerRef}
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
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
            className="absolute top-25 right-4 z-10 pointer-events-auto bg-white rounded-lg p-2.5 shadow-md border border-bs-neutral-200 text-bs-neutral-700 hover:bg-bs-neutral-50 disabled:opacity-60"
          >
            <PersonPin/>
          </button>
        </div>

        {selectedRestaurant && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="pointer-events-auto">
              <RestaurantPopupCard
                restaurant={selectedRestaurant}
                isFavorite={isFavorite(selectedRestaurant.id)}
                onClose={() => setSelectedPin(null)}
                onToggleFavorite={() => toggleFavorite(selectedRestaurant)}
                onDirections={() => handleDirections(selectedRestaurant)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col p-4 min-h-[320px] max-h-[50vh] lg:min-h-0 lg:max-h-full overflow-y-hidden">
        <ChatBoxPanel
          socketUrl={null}
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
                dummyResponses: [
                  "Based on your cravings, I'd suggest trying Spice Haven — great spicy noodles nearby!",
                  "How about Italian? Pasta Paradise has excellent gluten-free options.",
                  "For something quick, Taco Fiesta is only 8–12 minutes away.",
                  "Sushi Supreme is perfect if you're in the mood for Japanese tonight.",
                  "Tell me more about your dietary needs and I'll narrow it down!",
                ],
              },
            ],
          }}
        />
        <button
          onClick={() => navigate("/suggestions")}
          className="mt-3 w-full text-center text-sm text-bs-blue hover:underline py-2 max-h-[56px]"
        >
          View all suggestions →
        </button>
      </div>
    </div>
  );
}
