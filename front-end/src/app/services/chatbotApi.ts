import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export interface RestaurantResult {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ChatResponse {
  message: string;
  restaurants: RestaurantResult[];
}

export async function sendChatMessage(messages: ChatTurn[]): Promise<ChatResponse> {
  const { data } = await axios.post<ChatResponse>(
    `${API_BASE}/llm/chat`,
    { messages },
  );
  return data;
}

