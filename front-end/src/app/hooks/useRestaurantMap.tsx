import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import maplibregl from "maplibre-gl";
import { MapPinButton } from "../components/MapPin";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
} from "../data/mockRestaurants";
import type { Restaurant } from "../types/restaurant";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

function getRestaurantBounds(
  restaurants: Restaurant[],
): maplibregl.LngLatBoundsLike | null {
  if (restaurants.length === 0) return null;

  const lngs = restaurants.map((r) => r.coordinates[0]);
  const lats = restaurants.map((r) => r.coordinates[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

type MarkerEntry = {
  root: Root;
  marker: maplibregl.Marker;
  restaurant: Restaurant;
};

function renderMapPin(
  root: Root,
  restaurant: Restaurant,
  selected: boolean,
  onPinClick: (id: number) => void,
) {
  const pinType = restaurant.type === "gold" ? "gold" : "red";
  root.render(
    <MapPinButton
      type={pinType}
      selected={selected}
      onClick={() => onPinClick(restaurant.id)}
    />,
  );
}

export interface UseRestaurantMapOptions {
  restaurants: Restaurant[];
  selectedPin: number | null;
  onPinClick: (id: number) => void;
  onMapBackgroundClick?: () => void;
}

export function useRestaurantMap({
  restaurants,
  selectedPin,
  onPinClick,
  onMapBackgroundClick,
}: UseRestaurantMapOptions) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerEntriesRef = useRef<Map<number, MarkerEntry>>(new Map());
  const prevSelectedPinRef = useRef<number | null>(null);
  const onPinClickRef = useRef(onPinClick);
  const onMapBackgroundClickRef = useRef(onMapBackgroundClick);

  const [isLoading, setIsLoading] = useState(true);

  onPinClickRef.current = onPinClick;
  onMapBackgroundClickRef.current = onMapBackgroundClick;

  const handlePinClickStable = useCallback((id: number) => {
    onPinClickRef.current(id);
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
      const bounds = getRestaurantBounds(restaurants);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: 80,
          maxZoom: 14,
          duration: 0,
        });
      } else {
        map.setCenter(MAP_DEFAULT_CENTER);
        map.setZoom(MAP_DEFAULT_ZOOM);
      }
      map.resize();
      setIsLoading(false);
    });

    map.on("click", () => {
      onMapBackgroundClickRef.current?.();
    });

    return () => {
      markerEntriesRef.current.forEach(({ root, marker }) => {
        root.unmount();
        marker.remove();
      });
      markerEntriesRef.current.clear();
      prevSelectedPinRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [restaurants]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    const entries = markerEntriesRef.current;
    const restaurantIds = new Set(restaurants.map((r) => r.id));

    entries.forEach((entry, id) => {
      if (!restaurantIds.has(id)) {
        entry.root.unmount();
        entry.marker.remove();
        entries.delete(id);
      }
    });

    const currentSelectedPin = selectedPin;

    restaurants.forEach((restaurant) => {
      const existing = entries.get(restaurant.id);
      if (existing) {
        existing.restaurant = restaurant;
        existing.marker.setLngLat(restaurant.coordinates);
        renderMapPin(
          existing.root,
          restaurant,
          currentSelectedPin === restaurant.id,
          handlePinClickStable,
        );
        return;
      }

      const el = document.createElement("div");
      el.className = "map-marker";
      el.addEventListener("click", (e) => e.stopPropagation());

      const root = createRoot(el);
      renderMapPin(
        root,
        restaurant,
        currentSelectedPin === restaurant.id,
        handlePinClickStable,
      );

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(restaurant.coordinates)
        .addTo(map);

      entries.set(restaurant.id, { root, marker, restaurant });
    });
  }, [isLoading, restaurants, handlePinClickStable]);

  useEffect(() => {
    if (isLoading) return;

    const prev = prevSelectedPinRef.current;
    if (prev === selectedPin) return;

    const idsToUpdate = new Set<number>();
    if (prev !== null) idsToUpdate.add(prev);
    if (selectedPin !== null) idsToUpdate.add(selectedPin);

    idsToUpdate.forEach((id) => {
      const entry = markerEntriesRef.current.get(id);
      if (!entry) return;
      renderMapPin(
        entry.root,
        entry.restaurant,
        selectedPin === id,
        handlePinClickStable,
      );
    });

    prevSelectedPinRef.current = selectedPin;
  }, [selectedPin, isLoading, handlePinClickStable]);

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

  return { mapContainerRef, isLoading };
}
