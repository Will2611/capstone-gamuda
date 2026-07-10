import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  Marker as MapLibreMarker,
  Map as MapLibreMap,
  NavigationControl as MapLibreNavigationControl,
} from "maplibre-gl";
import { MapPinButton } from "../components/MapPin";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "../data/mockRestaurants";
import type { Restaurant } from "../types/restaurant";
import { isPromotionActive } from "../utils/promotionUtils";
import { fitMapAroundUser, getRestaurantBounds } from "../utils/mapUtils";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

type MarkerEntry = {
  root: Root;
  marker: MapLibreMarker;
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
      hasPromotion={restaurant.promotions?.some(isPromotionActive) ?? false}
      onClick={() => onPinClick(restaurant.id)}
    />,
  );
}

export interface UseRestaurantMapOptions {
  restaurants: Restaurant[];
  selectedPin: number | null;
  onPinClick: (id: number) => void;
  onMapBackgroundClick?: () => void;
  /** Set after the user clicks "Locate me"; triggers user-centered fitBounds. */
  userCenter?: [number, number] | null;
}

export function useRestaurantMap({
  restaurants,
  selectedPin,
  onPinClick,
  onMapBackgroundClick,
  userCenter = null,
}: UseRestaurantMapOptions) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
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

  // Mounting and unmounting
  const mountAndUnmount = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        setIsLoading(true);
        const map = new MapLibreMap({
          container: node,
          style: MAP_STYLE,
          center: MAP_DEFAULT_CENTER,
          zoom: MAP_DEFAULT_ZOOM,
        });

        map.addControl(new MapLibreNavigationControl(), "top-right");
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
        });

        map.on("click", () => {
          onMapBackgroundClickRef.current?.();
        });
        // Force to wait 1 cycle, to re-render anything missing
        setTimeout(() => {
          setIsLoading(false);
        });
        return;
      } else {
        markerEntriesRef.current.forEach(({ root, marker }) => {
          setTimeout(() => {
            root.unmount();
          }, 0);
          marker.remove();
        });
        markerEntriesRef.current.clear();
        prevSelectedPinRef.current = null;
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        mapRef.current?.remove();
        mapRef.current = null;
      }
    },
    [restaurants],
  );

  // User centre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading || !userCenter) return;

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#2563eb";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 6px rgba(0,0,0,0.35)";

      userMarkerRef.current = new MapLibreMarker({ element: el })
        .setLngLat(userCenter)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(userCenter);
    }

    fitMapAroundUser(map, userCenter, restaurants);
  }, [userCenter, isLoading, restaurants]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading || !userCenter) return;

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#2563eb";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 6px rgba(0,0,0,0.35)";

      userMarkerRef.current = new MapLibreMarker({ element: el })
        .setLngLat(userCenter)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(userCenter);
    }

    fitMapAroundUser(map, userCenter, restaurants);
  }, [userCenter, isLoading, restaurants]);

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

      const marker = new MapLibreMarker({ element: el, anchor: "bottom" })
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

  // Just to fly map
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

  return { isLoading, mountAndUnmount };
}
