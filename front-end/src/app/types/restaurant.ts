export interface Restaurant {
  id: number;
  name: string;
  rating: number;
  distance: string;
  dietary: string;
  cuisine: string;
  isOpen: boolean;
  type: "gold" | "red";
  position: { top: string; left: string };
  image?: string;
}

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

export interface UserProfileData {
  displayName: string;
  email: string;
  avatarUrl?: string;
  savedPreferences: SearchPreferences | null;
  searchHistory: SearchHistoryEntry[];
  favoriteRestaurants: Restaurant[];
}
