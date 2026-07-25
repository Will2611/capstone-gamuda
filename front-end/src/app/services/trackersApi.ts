import { bitescoutApi } from "./baseApi";

export type TrackedType = "Impression" | "Click" | "Visit";

export interface TrackerCreateResponse {
  id: string;
  restaurantId: string;
  trackedType: TrackedType;
  userId: string;
}

/** True for DB restaurant UUIDs; false for mock map pins like "1" / "2". */
export function isRestaurantUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

/**
 * Record a user→restaurant interaction.
 * Fire-and-forget friendly: callers should catch errors so UX is never blocked.
 */
export async function createTracker(
  restaurantId: string,
  trackedType: TrackedType,
): Promise<TrackerCreateResponse> {
  const { data } = await bitescoutApi.post<TrackerCreateResponse>("/trackers", {
    restaurantId,
    trackedType,
  });
  return data;
}

/** Non-blocking Visit for Get Directions — skips mock ids; ignores auth failures. */
export function trackVisit(restaurantId: string): void {
  if (!isRestaurantUuid(restaurantId)) return;
  void createTracker(restaurantId, "Visit").catch(() => {
    // Guest users / offline: directions still open without tracking.
  });
}
