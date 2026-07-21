import { bitescoutApi } from "./baseApi";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export interface RestaurantResult {
  id: string | null;
  name: string;
  cuisine: string;
  rating: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  review_count?: number;
  distance?: number;
  summary?: string;
  source?: string;
}

export interface ChatResponse {
  message: string;
  restaurants: RestaurantResult[];
}

export async function sendChatMessage(
  messages: ChatTurn[],
  latitude?: number,
  longitude?: number,
): Promise<ChatResponse> {
  const { data } = await bitescoutApi.post<ChatResponse>(`/llm/chat`, {
    messages,
    latitude,
    longitude,
  });
  return data;
}
