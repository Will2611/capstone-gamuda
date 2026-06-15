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
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

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
