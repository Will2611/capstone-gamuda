import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_RESTAURANTS } from "../data/mockRestaurants";
import type { Restaurant, SearchHistoryEntry } from "../types/restaurant";
import type { FullUserProfileData, SearchPreferences } from "../types/user";

const USER_STORAGE_KEY = "bitescouts_user_profile";

const DEFAULT_PROFILE: FullUserProfileData = {
  id: "0",
  displayName: "Alex Foodie",
  type: "client",
  email: "demo@bitescouts.com",
  avatarUrl: undefined,
  savedPreferences: {
    cuisine: ["asian"],
    priceRange: ["2"],
    dietary: ["vegetarian"],
    distance: "5",
    ambience: ["casual"],
    time: "dinner",
  },
  searchHistory: [
    {
      id: "1",
      query: "Spicy noodles near me",
      date: "May 20, 2026",
      preferences: { cuisine: ["asian"], dietary: ["vegetarian"] },
    },
    {
      id: "2",
      query: "Italian pasta gluten-free",
      date: "May 18, 2026",
      preferences: { cuisine: ["italian"], dietary: ["gluten-free"] },
    },
    {
      id: "3",
      query: "Vegan Mexican lunch",
      date: "May 15, 2026",
      preferences: { cuisine: ["mexican"], dietary: ["vegan"], time: "lunch" },
    },
  ],
  favoriteRestaurants: [MOCK_RESTAURANTS[0], MOCK_RESTAURANTS[3]],
};

interface UserContextValue {
  profile: FullUserProfileData;
  updatePreferences: (prefs: SearchPreferences) => void;
  addSearchHistory: (entry: Omit<SearchHistoryEntry, "id">) => void;
  toggleFavorite: (restaurant: Restaurant) => void;
  isFavorite: (restaurantId: number) => boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FullUserProfileData>(DEFAULT_PROFILE);

  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored) as FullUserProfileData);
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updatePreferences = useCallback((prefs: SearchPreferences) => {
    setProfile((prev) => ({ ...prev, savedPreferences: prefs }));
  }, []);

  const addSearchHistory = useCallback(
    (entry: Omit<SearchHistoryEntry, "id">) => {
      setProfile((prev) => ({
        ...prev,
        searchHistory: [
          { ...entry, id: crypto.randomUUID() },
          ...prev.searchHistory.slice(0, 9),
        ],
      }));
    },
    [],
  );

  const toggleFavorite = useCallback((restaurant: Restaurant) => {
    setProfile((prev) => {
      const exists = prev.favoriteRestaurants.some(
        (r) => r.id === restaurant.id,
      );
      return {
        ...prev,
        favoriteRestaurants: exists
          ? prev.favoriteRestaurants.filter((r) => r.id !== restaurant.id)
          : [...prev.favoriteRestaurants, restaurant],
      };
    });
  }, []);

  const isFavorite = useCallback(
    (restaurantId: number) =>
      profile.favoriteRestaurants.some((r) => r.id === restaurantId),
    [profile.favoriteRestaurants],
  );

  const value = useMemo(
    () => ({
      profile,
      updatePreferences,
      addSearchHistory,
      toggleFavorite,
      isFavorite,
    }),
    [profile, updatePreferences, addSearchHistory, toggleFavorite, isFavorite],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
