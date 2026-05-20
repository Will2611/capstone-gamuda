import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin } from "../components/MapPin";
import { RestaurantCard } from "../components/Card";
import { Button } from "../components/Button";
import { ReviewPanel } from "../components/reviews/ReviewPanel";

interface Restaurant {
  id: number;
  name: string;
  rating: number;
  distance: string;
  dietary: string;
  type: "gold" | "red";
  position: { top: string; left: string };
  image?: string;
}

export function MapInterface() {
  const navigate = useNavigate();
  const [selectedPin, setSelectedPin] = useState<number | null>(1);

  const restaurants: Restaurant[] = [
    {
      id: 1,
      name: "Spice Haven",
      rating: 4.8,
      distance: "10-15 min",
      dietary: "Vegetarian options",
      type: "gold",
      position: { top: "45%", left: "55%" },
    },
    {
      id: 2,
      name: "Pasta Paradise",
      rating: 4.5,
      distance: "12-18 min",
      dietary: "Gluten-free options",
      type: "red",
      position: { top: "30%", left: "40%" },
    },
    {
      id: 3,
      name: "Taco Fiesta",
      rating: 4.6,
      distance: "8-12 min",
      dietary: "Vegan options",
      type: "red",
      position: { top: "60%", left: "35%" },
    },
    {
      id: 4,
      name: "Sushi Supreme",
      rating: 4.7,
      distance: "15-20 min",
      dietary: "Gluten-free options",
      type: "red",
      position: { top: "25%", left: "65%" },
    },
  ];

  const selectedRestaurant = restaurants.find((r) => r.id === selectedPin);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Map Section */}
      <div className="flex-1 relative bg-gradient-to-br from-bs-neutral-100 to-bs-neutral-200">
        {/* Map Grid Pattern */}
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
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="50"
                stroke="#999"
                strokeWidth="0.5"
              />
              <line
                x1="0"
                y1="0"
                x2="50"
                y2="0"
                stroke="#999"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Roads/Streets */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="0"
            y1="40%"
            x2="100%"
            y2="40%"
            stroke="#666"
            strokeWidth="3"
          />
          <line
            x1="0"
            y1="70%"
            x2="100%"
            y2="70%"
            stroke="#666"
            strokeWidth="3"
          />
          <line
            x1="30%"
            y1="0"
            x2="30%"
            y2="100%"
            stroke="#666"
            strokeWidth="3"
          />
          <line
            x1="60%"
            y1="0"
            x2="60%"
            y2="100%"
            stroke="#666"
            strokeWidth="3"
          />
        </svg>

        {/* Restaurant Pins */}
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
              onClick={() => setSelectedPin(restaurant.id)}
            />
          </div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-white rounded-lg p-4 shadow-lg">
          <h4 className="mb-3">Legend</h4>
          <div className="flex items-center gap-3 mb-2">
            <MapPin type="gold" />
            <span className="text-sm text-bs-neutral-700">Top Match</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin type="red" />
            <span className="text-sm text-bs-neutral-700">Alternatives</span>
          </div>
        </div>
      </div>

      {/* Restaurant Details Panel */}
      <div className="w-full md:w-[500px] lg:w-[600px] bg-white overflow-y-auto border-t md:border-t-0 md:border-l border-bs-neutral-200">
        {selectedRestaurant ? (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="mb-2">{selectedRestaurant.name}</h2>
              {selectedRestaurant.type === "gold" && (
                <div className="inline-block bg-bs-gold/20 text-bs-neutral-900 px-3 py-1 rounded-full text-sm">
                  Top Match
                </div>
              )}
            </div>

            <RestaurantCard
              name={selectedRestaurant.name}
              rating={selectedRestaurant.rating}
              distance={selectedRestaurant.distance}
              dietary={selectedRestaurant.dietary}
              onDirections={() =>
                alert(`Navigating to ${selectedRestaurant.name}...`)
              }
            />

            <div className="p-4 bg-bs-blue/10 rounded-lg">
              <h4 className="mb-2">Why this match?</h4>
              <p className="text-sm text-bs-neutral-700">
                Highly rated for{" "}
                {selectedRestaurant.name.includes("Spice")
                  ? "spicy noodles"
                  : "your cuisine preference"}
                ;{selectedRestaurant.distance} drive;{" "}
                {selectedRestaurant.dietary.toLowerCase()} available
              </p>
            </div>

            {/* Review Panel */}
            <ReviewPanel
              restaurantId={selectedRestaurant.id}
              restaurantName={selectedRestaurant.name}
            />

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate("/suggestions")}
            >
              View All Suggestions
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 px-6 text-bs-neutral-500">
            <p>Click a pin on the map to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
