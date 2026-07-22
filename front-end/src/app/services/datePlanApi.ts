import { bitescoutApi } from "./baseApi";
import type { DatePlan, MatchUser } from "../types/foodMatch";

export interface EnsureMatchResponse {
  match_id: string;
  chat_room_id: string;
  participant_id: string;
  is_new: boolean;
}

/** Cookie session auth — credentials sent via bitescoutApi (withCredentials). */
export async function ensureMatch(
  participant: MatchUser,
  latitude?: number,
  longitude?: number,
): Promise<EnsureMatchResponse> {
  const { data } = await bitescoutApi.post<EnsureMatchResponse>(
    `/food-match/ensure-match`,
    {
      participant: {
        id: participant.id,
        name: participant.name,
        age: participant.age,
        avatarUrl: participant.avatarUrl,
        bio: participant.bio,
        favoriteFoods: participant.favoriteFoods,
        personalityTags: participant.personalityTags,
        lookingFor: participant.lookingFor,
      },
      latitude,
      longitude,
    },
  );
  return data;
}

export async function updateFoodMatchLocation(
  latitude: number,
  longitude: number,
) {
  const { data } = await bitescoutApi.post(`/food-match/location`, {
    latitude,
    longitude,
  });
  return data;
}

export interface DiscoverMatchUserDto {
  id: string;
  name: string;
  age: number;
  avatarUrl?: string | null;
  bio: string;
  favoriteFoods: string[];
  favoriteRestaurants: string[];
  personalityTags: string[];
  lookingFor: string;
  distanceKm?: number | null;
}

export interface DiscoverResponse {
  users: DiscoverMatchUserDto[];
  radius_km: number;
  geohash_prefix?: string | null;
  message?: string | null;
}

export async function discoverNearby(
  radiusKm?: number,
): Promise<DiscoverResponse> {
  const { data } = await bitescoutApi.get<DiscoverResponse>(
    `/food-match/discover`,
    {
      params: radiusKm != null ? { radius_km: radiusKm } : undefined,
    },
  );
  return data;
}

export interface LikeResponse {
  matched: boolean;
  match_id?: string | null;
  chat_room_id?: string | null;
  participant_id?: string | null;
  participant?: DiscoverMatchUserDto | null;
  message: string;
}

export async function likeNearbyUser(userId: string): Promise<LikeResponse> {
  const { data } = await bitescoutApi.post<LikeResponse>(`/food-match/like`, {
    user_id: userId,
  });
  return data;
}

export async function passNearbyUser(userId: string) {
  const { data } = await bitescoutApi.post(`/food-match/pass`, {
    user_id: userId,
  });
  return data;
}

export interface FoodMatchListItemDto {
  match_id: string;
  chat_room_id?: string | null;
  participant: DiscoverMatchUserDto;
  matched_at?: string | null;
  is_connected: boolean;
}

export async function listFoodMatches() {
  const { data } = await bitescoutApi.get<{ matches: FoodMatchListItemDto[] }>(
    `/food-match/matches`,
  );
  return data.matches;
}

export async function clearFoodMatches() {
  const { data } = await bitescoutApi.delete<{
    status: string;
    cleared_matches: number;
    cleared_likes: number;
  }>(`/food-match/matches`);
  return data;
}

export function toMatchUser(dto: DiscoverMatchUserDto): MatchUser {
  return {
    id: String(dto.id),
    name: dto.name,
    age: dto.age || 0,
    avatarUrl: dto.avatarUrl || "",
    bio: dto.bio || "",
    favoriteFoods: dto.favoriteFoods || [],
    favoriteRestaurants: dto.favoriteRestaurants || [],
    personalityTags: dto.personalityTags || [],
    lookingFor: (dto.lookingFor as MatchUser["lookingFor"]) || "food-buddy",
  };
}

export async function createDatePlan(matchId: string): Promise<DatePlan> {
  const { data } = await bitescoutApi.post<DatePlan>(`/date-plan`, {
    match_id: matchId,
  });
  return data;
}

export async function getDatePlan(planId: string): Promise<DatePlan> {
  const { data } = await bitescoutApi.get<DatePlan>(`/date-plan/${planId}`);
  return data;
}

export async function getDatePlanByMatch(matchId: string): Promise<DatePlan> {
  const { data } = await bitescoutApi.get<DatePlan>(
    `/date-plan/by-match/${matchId}`,
  );
  return data;
}

export async function submitAvailability(
  planId: string,
  body: {
    available_date: string;
    start_time: string;
    end_time: string;
    timezone?: string;
  },
): Promise<DatePlan> {
  const { data } = await bitescoutApi.post<DatePlan>(
    `/date-plan/${planId}/availability`,
    {
      timezone: "Asia/Kuala_Lumpur",
      ...body,
    },
  );
  return data;
}

export async function acceptSuggestion(planId: string): Promise<DatePlan> {
  const { data } = await bitescoutApi.post<DatePlan>(
    `/date-plan/${planId}/accept-suggestion`,
    { accept: true },
  );
  return data;
}

export async function recommendRestaurants(planId: string): Promise<DatePlan> {
  const { data } = await bitescoutApi.post<DatePlan>(
    `/date-plan/${planId}/recommend`,
    {},
  );
  return data;
}

export async function nextRestaurant(
  planId: string,
  version?: number,
): Promise<DatePlan> {
  const { data } = await bitescoutApi.post<DatePlan>(
    `/date-plan/${planId}/next-restaurant`,
    { version },
  );
  return data;
}

export async function acceptDatePlan(planId: string): Promise<DatePlan> {
  const { data } = await bitescoutApi.post<DatePlan>(
    `/date-plan/${planId}/accept`,
    {},
  );
  return data;
}

export async function cancelDatePlan(planId: string): Promise<DatePlan> {
  const { data } = await bitescoutApi.post<DatePlan>(
    `/date-plan/${planId}/cancel`,
    {},
  );
  return data;
}

/** Browser sends the session cookie automatically on same-site WS connect. */
export function buildChatSocketUrl(chatRoomId: string): string {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const base = apiBase.replace(/^http/, "ws");
  return `${base}/chat/ws/${chatRoomId}`;
}
