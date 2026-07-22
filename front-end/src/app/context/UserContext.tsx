import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
// import { MOCK_RESTAURANTS } from "../data/mockRestaurants";
import type { Restaurant, SearchHistoryEntry } from "../types/restaurant";
import type { FullUserProfileData, SearchPreferences } from "../types/user";
import { useAuth } from "./AuthContext";
import { bitescoutApi } from "../services/baseApi";
import { useLoading } from "./LoadingContext";

const USER_STORAGE_KEY = "bitescouts_user_profile";

// const DEFAULT_PROFILE: FullUserProfileData = {
//   id: "0",
//   displayName: "Alex Foodie",
//   type: "client",
//   email: "demo@bitescouts.com",
//   avatarUrl: undefined,
//   savedPreferences: {
//     cuisine: ["asian"],
//     priceRange: ["2"],
//     dietary: ["vegetarian"],
//     distance: "5",
//     ambience: ["casual"],
//     time: "dinner",
//   },
//   searchHistory: [
//     {
//       id: "1",
//       query: "Spicy noodles near me",
//       date: "May 20, 2026",
//       preferences: { cuisine: ["asian"], dietary: ["vegetarian"] },
//     },
//     {
//       id: "2",
//       query: "Italian pasta gluten-free",
//       date: "May 18, 2026",
//       preferences: { cuisine: ["italian"], dietary: ["gluten-free"] },
//     },
//     {
//       id: "3",
//       query: "Vegan Mexican lunch",
//       date: "May 15, 2026",
//       preferences: { cuisine: ["mexican"], dietary: ["vegan"], time: "lunch" },
//     },
//   ],
//   favoriteRestaurants: [MOCK_RESTAURANTS[0], MOCK_RESTAURANTS[3]],
// };

interface UserContextValue {
  profile: FullUserProfileData;
  profileLoading: boolean;
  profileError: string | null;
  updateUserProfile: (
    updateData: Partial<FullUserProfileData>,
  ) => Promise<void>;
  updatePreferences: (prefs: SearchPreferences) => void;
  addSearchHistory: (entry: Omit<SearchHistoryEntry, "id">) => void;
  toggleFavorite: (restaurant: Restaurant) => void;
  isFavorite: (restaurantId: string) => boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const [profile, setProfile] = useState<FullUserProfileData>(
    {} as FullUserProfileData,
  );
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // useEffect(() => {
  //   const stored = localStorage.getItem(USER_STORAGE_KEY);
  //   if (stored) {
  //     try {
  //       setProfile(JSON.parse(stored) as FullUserProfileData);
  //     } catch {
  //       localStorage.removeItem(USER_STORAGE_KEY);
  //     }
  //   }
  // }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);

      // const token = localStorage.getItem("bitescouts_token");

      try {
        const { data } = await bitescoutApi.get(
          `/user/client/personal_profile`,
        );
        // const response = await fetch(
        //   `http://localhost:8000/user/client/personal_profile`,
        //   {
        //     headers: {
        //       Authorization: `Bearer ${token}`,
        //       "Content-Type": "application/json",
        //     },
        //   },
        // );

        // if (!response.ok) {
        //   throw new Error(`Failed to load profile (Status: ${response.status})`);
        // }

        // const data = await response.json();

        // Map backend snake_case fields → FullUserProfileData camelCase shape
        setProfile((prev) => ({
          ...prev,
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          avatarUrl: data.avatar_url ?? undefined,
          type: data.user_type,
          gender: data.gender ?? undefined,
          birthday: data.birthday ?? undefined,
          religion: data.religion ?? undefined,
          language: data.language ?? undefined,
          personalities: data.personalities ?? [], //
          savedPreferences: data.savedPreferences ?? prev.savedPreferences,
          searchHistory: data.searchHistory ?? prev.searchHistory,
          favoriteRestaurants:
            data.favoriteRestaurants ?? prev.favoriteRestaurants,
        }));
      } catch (err: any) {
        setProfileError(err.message || "An unexpected error occurred.");
      } finally {
        setProfileLoading(false);
      }
    };

    withLoading(fetchUserProfile)();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // 2. PROCESS UPDATE AT CONTEXT LEVEL
  const updateUserProfile = useCallback(
    async (payload: any) => {
      if (!user?.id) throw new Error("No authenticated user");

      // Transform context/frontend payload to backend expected schema
      const body = {
        username: payload.displayName,
        profileImage: payload.avatarUrl,
        gender: payload.gender,
        birthday: payload.birthday,
        religion: payload.religion,
        language: payload.language,
        preferences: payload.savedPreferences,
        personalities: payload.personalities,
      };

      await bitescoutApi.put(`/user/client/${user.id}`, body);

      // Update local context state with server response / merged payload
      setProfile((prev) => ({
        ...prev,
        displayName: payload.displayName ?? prev.displayName,
        avatarUrl: payload.avatarUrl ?? prev.avatarUrl,
        gender: payload.gender ?? prev.gender,
        birthday: payload.birthday ?? prev.birthday,
        religion: payload.religion ?? prev.religion,
        language: payload.language ?? prev.language,
        personalities: payload.personalities ?? prev.personalities,
        savedPreferences: payload.savedPreferences ?? prev.savedPreferences,
      }));
    },
    [user],
  );

  //       username: fullName,
  //       profileImage: profileImage,
  //       gender: gender,
  //       birthday: birthday,
  //       religion: religion,
  //       language: language,
  //       preferences: preferences,
  //       personalities: personalities,
  //     };

  //     const response = await fetch(
  //       `http://localhost:8000/user/client/${user?.id}`,
  //       {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: token ? `Bearer ${token}` : "",
  //         },
  //         body: JSON.stringify(updateData),
  //       },
  //     );

  //     if (!response.ok) {
  //       const errData = await response.json();
  //       throw new Error(errData.detail || "Failed to update profile");
  //     }

  //     await updatePreferences(preferences);
  //     setSuccess(true);
  //     setTimeout(() => navigate("/profile"), 1500);
  //   } catch (error: any) {
  //     console.error("Failed to update preferences:", error);
  //     setErrors((prev) => ({
  //       ...prev,
  //       apiError: error.message || "Failed to update profile",
  //     }));
  //   } finally {
  //     setIsLoading(false);
  //   }

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
    (restaurantId: string) => {
      const favouriteRestaurants = profile.favoriteRestaurants || [];
      return favouriteRestaurants.some((r) => r.id === restaurantId);
    },
    [profile.favoriteRestaurants],
  );

  const value = useMemo(
    () => ({
      profile,
      profileLoading,
      profileError,
      updateUserProfile: withLoading(updateUserProfile),
      updatePreferences,
      addSearchHistory,
      toggleFavorite,
      isFavorite,
    }),
    [
      profile,
      profileLoading,
      profileError,
      updateUserProfile,
      updatePreferences,
      addSearchHistory,
      toggleFavorite,
      isFavorite,
    ],
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
