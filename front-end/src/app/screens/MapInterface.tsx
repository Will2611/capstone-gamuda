import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useNavigate } from "react-router";
import maplibregl from "maplibre-gl";
import { MapPin } from "../components/MapPin";
import { ChatbotPanel } from "../components/ChatbotPanel";
import { RestaurantPopupCard } from "../components/RestaurantPopupCard";
import { Skeleton } from "../components/ui/skeleton";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MOCK_RESTAURANTS,
} from "../data/mockRestaurants";
import { useUser } from "../context/UserContext";
import type { Restaurant } from "../types/restaurant";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

function getRestaurantBounds(
  restaurants: Restaurant[],
): maplibregl.LngLatBoundsLike {
  const lngs = restaurants.map((r) => r.coordinates[0]);
  const lats = restaurants.map((r) => r.coordinates[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export default function MapInterface() {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useUser();
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markerRootsRef = useRef<Root[]>([]);

  const restaurants: Restaurant[] = MOCK_RESTAURANTS;
  const selectedRestaurant = restaurants.find((r) => r.id === selectedPin);

  const handlePinClick = useCallback((id: number) => {
    setSelectedPin((current) => (current === id ? null : id));
  }, []);

  const handleDirections = useCallback((restaurant: Restaurant) => {
    const [lng, lat] = restaurant.coordinates;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank",
    );
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.fitBounds(getRestaurantBounds(restaurants), {
        padding: 80,
        maxZoom: 14,
        duration: 0,
      });
      map.resize();
      setIsLoading(false);
    });

    map.on("click", () => {
      setSelectedPin(null);
    });

    return () => {
      markerRootsRef.current.forEach((root) => root.unmount());
      markerRootsRef.current = [];
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [restaurants]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    markerRootsRef.current.forEach((root) => root.unmount());
    markerRootsRef.current = [];
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    restaurants.forEach((restaurant) => {
      const el = document.createElement("div");
      el.className = "map-marker";
      el.addEventListener("click", (e) => e.stopPropagation());

      const root = createRoot(el);
      root.render(
        <MapPin
          type={restaurant.type}
          selected={selectedPin === restaurant.id}
          onClick={() => handlePinClick(restaurant.id)}
        />,
      );
      markerRootsRef.current.push(root);

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(restaurant.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [isLoading, selectedPin, restaurants, handlePinClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading || selectedPin === null) return;

    const restaurant = restaurants.find((r) => r.id === selectedPin);
    if (!restaurant) return;

    map.flyTo({
      center: restaurant.coordinates,
      zoom: 15,
      duration: 800,
    });
  }, [selectedPin, isLoading, restaurants]);

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
              <MapPin type="gold" />
              <span>Top Match</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-bs-neutral-700">
              <MapPin type="red" />
              <span>Alternatives</span>
            </div>
          </div>

          {!selectedRestaurant && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-md text-sm text-bs-neutral-600 border border-bs-neutral-200">
              Tap a pin to view restaurant details
            </div>
          )}
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
