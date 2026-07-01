import { LngLatBounds as MapLibreLngLatBounds} from "maplibre-gl";
import type {Map as MapLibreMap, LngLatBoundsLike as MapLibreLngLatBoundsLike} from "maplibre-gl";
import type { Restaurant } from "../types/restaurant";
import { MAP_DEFAULT_ZOOM } from "../data/mockRestaurants";

export function getRestaurantBounds(
  restaurants: Restaurant[],
): MapLibreLngLatBoundsLike | null {
  if (restaurants.length === 0) return null;

  const lngs = restaurants.map((r) => r.coordinates[0]);
  const lats = restaurants.map((r) => r.coordinates[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/** Fit restaurants into view while keeping the map centered on the user. */
export function fitMapAroundUser(
  map: MapLibreMap,
  userCenter: [number, number],
  restaurants: Restaurant[],
  options?: { duration?: number },
) {
  const bounds = new MapLibreLngLatBounds();
  bounds.extend(userCenter);
  restaurants.forEach((r) => bounds.extend(r.coordinates));

  const camera = map.cameraForBounds(bounds, {
    padding: 80,
    maxZoom: 14,
  });

  map.easeTo({
    center: userCenter,
    zoom: camera?.zoom ?? MAP_DEFAULT_ZOOM,
    bearing: camera?.bearing ?? 0,
    duration: options?.duration ?? 800,
  });
}
