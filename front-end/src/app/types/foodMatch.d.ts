export type LookingFor = "friend" | "relationship" | "food-buddy";

export interface FoodPreferenceProfile {
  favoriteFoods: string[];
  personalityTags: string[];
  budgetRange: string;
  halal: boolean;
  vegetarian: boolean;
  preferredDiningTime: string;
  meetupDistance: string;
  profileComplete: boolean;
  profileVisible: boolean;
}

export interface MatchUser {
  id: string;
  name: string;
  age: number;
  avatarUrl: string;
  bio: string;
  favoriteFoods: string[];
  favoriteRestaurants: string[];
  personalityTags: string[];
  lookingFor: LookingFor;
  likesBack?: boolean;
}

export interface FoodMatch {
  id: string;
  user: MatchUser;
  compatibilityScore: number;
  sharedInterests: string[];
  matchedAt: string;
  chatExpiresAt: string;
  saved: boolean;
  /** Real backend match UUID once ensure-match succeeds */
  backendMatchId?: string;
  /** Real chat room UUID for WebSocket */
  chatRoomId?: string;
  backendParticipantId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  /** Optional structured payload for date-plan system cards */
  payload?: DatePlanChatPayload | null;
}

export type DatePlanStatus =
  | "draft"
  | "waiting_partner"
  | "no_overlap"
  | "overlap_found"
  | "recommending"
  | "restaurant_ready"
  | "accepted"
  | "cancelled"
  | "expired";

export interface AvailabilitySlot {
  available_date: string;
  start_time: string;
  end_time: string;
  timezone?: string;
}

export interface AvailabilityView {
  user_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
}

export interface OverlapView {
  date: string;
  start_time: string;
  end_time: string;
  meeting_time: string;
}

export interface SuggestedSlotView {
  date: string;
  start_time: string;
  end_time: string;
  meeting_time: string;
  rationale: string;
}

export interface RestaurantCandidateView {
  id: string;
  name: string;
  cuisine: string;
  rating?: number | null;
  price_level?: number | null;
  summary?: string | null;
  photos: string[];
  address?: string | null;
  distance_a_km: number;
  distance_b_km: number;
  travel_time_a_min: number;
  travel_time_b_min: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DateIdeasView {
  restaurant_name: string;
  summary: string;
  why_both: string;
  conversation_starters: string[];
  ice_breakers: string[];
  fun_food_challenge: string;
  nearby_dessert?: string | null;
  nearby_activity?: string | null;
  estimated_budget: string;
  suggested_meeting_time: string;
  expected_duration: string;
  vibe: string;
}

export interface DatePlan {
  id: string;
  match_id: string;
  chat_room_id?: string | null;
  status: DatePlanStatus;
  created_by: string;
  yours?: AvailabilityView | null;
  theirs?: AvailabilityView | null;
  overlap?: OverlapView | null;
  suggested?: SuggestedSlotView | null;
  recommendation?: RestaurantCandidateView | null;
  date_ideas?: DateIdeasView | null;
  ranking_reason?: string | null;
  accepted_by: string[];
  candidate_index: number;
  candidate_count: number;
  restaurants_exhausted?: boolean;
  version: number;
  message?: string | null;
}

export interface DatePlanChatPayload {
  event: string;
  plan_id?: string;
  plan?: DatePlan;
}

/** @deprecated Use DatePlan — kept for compatibility */
export interface FoodDatePlan {
  restaurantId: number;
  restaurantName: string;
  date: string;
  time: string;
  cuisine: string;
  message: string;
}

export interface SuggestedRestaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  distance: string;
  image: string;
  matchReason: string;
}
