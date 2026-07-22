import axios from "axios";
import type { DatePlan, MatchUser } from "../types/foodMatch";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function authHeaders(token: string | null | undefined) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface EnsureMatchResponse {
  match_id: string;
  chat_room_id: string;
  participant_id: string;
  is_new: boolean;
}

export async function ensureMatch(
  token: string,
  participant: MatchUser,
  latitude?: number,
  longitude?: number,
): Promise<EnsureMatchResponse> {
  const { data } = await axios.post<EnsureMatchResponse>(
    `${API_BASE}/food-match/ensure-match`,
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
    { headers: authHeaders(token) },
  );
  return data;
}

export async function updateFoodMatchLocation(
  token: string,
  latitude: number,
  longitude: number,
) {
  const { data } = await axios.post(
    `${API_BASE}/food-match/location`,
    { latitude, longitude },
    { headers: authHeaders(token) },
  );
  return data;
}

export async function createDatePlan(
  token: string,
  matchId: string,
): Promise<DatePlan> {
  const { data } = await axios.post<DatePlan>(
    `${API_BASE}/date-plan`,
    { match_id: matchId },
    { headers: authHeaders(token) },
  );
  return data;
}

export async function getDatePlan(
  token: string,
  planId: string,
): Promise<DatePlan> {
  const { data } = await axios.get<DatePlan>(
    `${API_BASE}/date-plan/${planId}`,
    { headers: authHeaders(token) },
  );
  return data;
}

export async function getDatePlanByMatch(
  token: string,
  matchId: string,
): Promise<DatePlan> {
  const { data } = await axios.get<DatePlan>(
    `${API_BASE}/date-plan/by-match/${matchId}`,
    { headers: authHeaders(token) },
  );
  return data;
}

export async function submitAvailability(
  token: string,
  planId: string,
  body: {
    available_date: string;
    start_time: string;
    end_time: string;
    timezone?: string;
  },
): Promise<DatePlan> {
  const { data } = await axios.post<DatePlan>(
    `${API_BASE}/date-plan/${planId}/availability`,
    {
      timezone: "Asia/Kuala_Lumpur",
      ...body,
    },
    { headers: authHeaders(token) },
  );
  return data;
}

export async function acceptSuggestion(
  token: string,
  planId: string,
): Promise<DatePlan> {
  const { data } = await axios.post<DatePlan>(
    `${API_BASE}/date-plan/${planId}/accept-suggestion`,
    { accept: true },
    { headers: authHeaders(token) },
  );
  return data;
}

export async function recommendRestaurants(
  token: string,
  planId: string,
): Promise<DatePlan> {
  const { data } = await axios.post<DatePlan>(
    `${API_BASE}/date-plan/${planId}/recommend`,
    {},
    { headers: authHeaders(token) },
  );
  return data;
}

export async function nextRestaurant(
  token: string,
  planId: string,
  version?: number,
): Promise<DatePlan> {
  const { data } = await axios.post<DatePlan>(
    `${API_BASE}/date-plan/${planId}/next-restaurant`,
    { version },
    { headers: authHeaders(token) },
  );
  return data;
}

export async function acceptDatePlan(
  token: string,
  planId: string,
): Promise<DatePlan> {
  const { data } = await axios.post<DatePlan>(
    `${API_BASE}/date-plan/${planId}/accept`,
    {},
    { headers: authHeaders(token) },
  );
  return data;
}

export async function cancelDatePlan(
  token: string,
  planId: string,
): Promise<DatePlan> {
  const { data } = await axios.post<DatePlan>(
    `${API_BASE}/date-plan/${planId}/cancel`,
    {},
    { headers: authHeaders(token) },
  );
  return data;
}

export function buildChatSocketUrl(
  chatRoomId: string,
  token?: string | null,
): string {
  const base = API_BASE.replace(/^http/, "ws");
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${base}/chat/ws/${chatRoomId}${qs}`;
}
