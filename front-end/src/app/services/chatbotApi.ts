import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
  suggestions?: string[];
}

export async function sendChatMessage(
  messages: ChatTurn[],
  latitude?: number,
  longitude?: number,
): Promise<ChatResponse> {
  const { data } = await axios.post<ChatResponse>(
    `${API_BASE}/llm/chat`,
    { messages, latitude, longitude },
  );
  return data;
}

