/**
 * Helps with avatarURL, and also the isAuthenticated for protected routes
 */

import type { Restaurant } from "./restaurant";

export const userTypeEnum = {
  CLIENT: "client",
  OWNER: "owner",
  BOT: "bot",
} as const;

export type USERTYPE = (typeof userTypeEnum)[keyof typeof userTypeEnum];
// type USERTYPE = "client" | "owner" | "bot";

export interface SearchPreferences {
  cuisine: string;
  priceRange: string;
  dietary: string;
  distance: string;
  ambience: string;
  time: string;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  date: string;
  preferences: Partial<SearchPreferences>;
}

/**
 * For anyone finding public profile, for better matching
 */
export interface PublicUserProfileData {
  id: string;
  type: USERTYPE;
  displayName: string;
  avatarUrl?: string;
  savedPreferences: Partial<SearchPreferences> | null;
  favoriteRestaurants: Restaurant[];

  bio?: string;
  favoriteFoods?: string[];
  personalityTags?: string[];
  lookingFor?: string;
  likesBack?: boolean;
}

/**
 * For Personal, NOT PUBLIC includes email
 */
export interface FullUserProfileData extends PublicUserProfileData {
  email: string;
  searchHistory: SearchHistoryEntry[];
}

export interface DummyUserProfile extends Omit<
  PublicUserProfileData,
  "favoriteRestaurants" | "savedPreferences"
> {
  dummyResponses: string[];
}
