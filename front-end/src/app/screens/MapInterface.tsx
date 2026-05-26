import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MapPin } from "../components/MapPin";
import { ChatbotPanel } from "../components/ChatbotPanel";
import { RestaurantPopupCard } from "../components/RestaurantPopupCard";
import { MapLoadingSkeleton } from "../components/MapLoadingSkeleton";
import { MOCK_RESTAURANTS } from "../data/mockRestaurants";
import { useUser } from "../context/UserContext";
import type { Restaurant } from "../types/restaurant";

export function MapInterface() {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useUser();
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restaurants: Restaurant[] = MOCK_RESTAURANTS;
  const selectedRestaurant = restaurants.find((r) => r.id === selectedPin);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handlePinClick = (id: number) => {
    setSelectedPin(selectedPin === id ? null : id);
  };

  const handleDirections = (name: string) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      "_blank"
    );
  };

  if (isLoading) {
    return <MapLoadingSkeleton />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] bg-bs-neutral-100 gap-0 lg:gap-4 lg:p-4 overflow-hidden">
      {/* Map Section */}
      <div className="flex-1 relative min-h-[45vh] lg:min-h-0 rounded-none lg:rounded-xl overflow-hidden border-0 lg:border border-bs-neutral-200 shadow-md lg:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-bs-neutral-100 to-bs-neutral-200">
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                x="0"
                y="0"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="0" y2="50" stroke="#999" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="50" y2="0" stroke="#999" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <svg
            className="absolute inset-0 w-full h-full opacity-30"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#666" strokeWidth="3" />
            <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#666" strokeWidth="3" />
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#666" strokeWidth="3" />
            <line x1="60%" y1="0" x2="60%" y2="100%" stroke="#666" strokeWidth="3" />
          </svg>

          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              style={{
                position: "absolute",
                top: restaurant.position.top,
                left: restaurant.position.left,
                transform: "translate(-50%, -100%)",
              }}
            >
              <MapPin
                type={restaurant.type}
                selected={selectedPin === restaurant.id}
                onClick={() => handlePinClick(restaurant.id)}
              />
            </div>
          ))}

          <div className="absolute bottom-4 right-4 bg-white rounded-xl p-4 shadow-lg border border-bs-neutral-200">
            <h4 className="text-sm font-medium mb-2">Legend</h4>
            <div className="flex items-center gap-2 mb-1.5 text-sm text-bs-neutral-700">
              <MapPin type="gold" />
              <span>Top Match</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-bs-neutral-700">
              <MapPin type="red" />
              <span>Alternatives</span>
            </div>
          </div>

          {!selectedRestaurant && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-md text-sm text-bs-neutral-600 border border-bs-neutral-200">
              Tap a pin to view restaurant details
            </div>
          )}
        </div>

        {selectedRestaurant && (
          <RestaurantPopupCard
            restaurant={selectedRestaurant}
            isFavorite={isFavorite(selectedRestaurant.id)}
            onClose={() => setSelectedPin(null)}
            onToggleFavorite={() => toggleFavorite(selectedRestaurant)}
            onDirections={() => handleDirections(selectedRestaurant.name)}
          />
        )}
      </div>

      {/* Chatbot Panel — side on desktop, below on mobile */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col min-h-[320px] lg:min-h-0 lg:max-h-full p-4 lg:p-0">
        <ChatbotPanel />
        <button
          onClick={() => navigate("/suggestions")}
          className="mt-3 w-full text-center text-sm text-bs-blue hover:underline py-2"
        >
          View all suggestions →
        </button>
      </div>
    </div>
  );
}
