import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_FOOD_PROFILE,
  MOCK_MATCH_USERS,
  computeCompatibility,
} from "../data/mockFoodMatch";
import type {
  ChatMessage,
  FoodMatch,
  FoodPreferenceProfile,
  MatchUser,
} from "../types/foodMatch";

const STORAGE_KEY = "bitescouts_food_match";

const CHAT_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

interface FoodMatchState {
  profile: FoodPreferenceProfile;
  passedIds: string[];
  matches: FoodMatch[];
  savedIds: string[];
  blockedIds: string[];
  chatMessages: Record<string, ChatMessage[]>;
}

interface FoodMatchContextValue extends FoodMatchState {
  updateProfile: (updates: Partial<FoodPreferenceProfile>) => void;
  completeProfile: () => void;
  passUser: (userId: string) => void;
  likeUser: (user: MatchUser) => FoodMatch | null;
  saveUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  reportUser: (userId: string) => void;
  getDiscoverUsers: () => MatchUser[];
  addChatMessage: (matchId: string, text: string, senderId: string) => void;
  resetDiscoverPool: () => void;
}

const FoodMatchContext = createContext<FoodMatchContextValue | null>(null);

function createMatch(
  user: MatchUser,
  profile: FoodPreferenceProfile,
): FoodMatch {
  const { score, sharedInterests } = computeCompatibility(profile, user);
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    user,
    compatibilityScore: score,
    sharedInterests,
    matchedAt: now.toISOString(),
    chatExpiresAt: new Date(now.getTime() + CHAT_DURATION_MS).toISOString(),
    saved: false,
  };
}

const DEFAULT_STATE: FoodMatchState = {
  profile: DEFAULT_FOOD_PROFILE,
  passedIds: [],
  matches: [],
  savedIds: [],
  blockedIds: [],
  chatMessages: {},
};

export function FoodMatchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FoodMatchState>(DEFAULT_STATE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setState(JSON.parse(stored) as FoodMatchState);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateProfile = useCallback(
    (updates: Partial<FoodPreferenceProfile>) => {
      setState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updates },
      }));
    },
    [],
  );

  const completeProfile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, profileComplete: true },
    }));
  }, []);

  const passUser = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      passedIds: [...prev.passedIds, userId],
    }));
  }, []);

  const likeUser = useCallback((user: MatchUser): FoodMatch | null => {
    if (!user.likesBack) {
      setState((prev) => ({
        ...prev,
        passedIds: [...prev.passedIds, user.id],
      }));
      return null;
    }
    let created: FoodMatch | null = null;
    setState((prev) => {
      const exists = prev.matches.some((m) => m.user.id === user.id);
      if (exists) return prev;
      const match = createMatch(user, prev.profile);
      created = match;
      const welcomeMsg: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: user.id,
        text: `Hey! Excited to explore food together 🍽️`,
        timestamp: new Date().toISOString(),
      };
      return {
        ...prev,
        matches: [...prev.matches, match],
        passedIds: [...prev.passedIds, user.id],
        chatMessages: {
          ...prev.chatMessages,
          [match.id]: [welcomeMsg],
        },
      };
    });
    return created;
  }, []);

  const resetDiscoverPool = useCallback(() => {
    setState((prev) => ({ ...prev, passedIds: [] }));
  }, []);

  const saveUser = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      savedIds: prev.savedIds.includes(userId)
        ? prev.savedIds.filter((id) => id !== userId)
        : [...prev.savedIds, userId],
    }));
  }, []);

  const blockUser = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      blockedIds: [...prev.blockedIds, userId],
      matches: prev.matches.filter((m) => m.user.id !== userId),
      passedIds: [...prev.passedIds, userId],
    }));
  }, []);

  const reportUser = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      blockedIds: [...prev.blockedIds, userId],
      passedIds: [...prev.passedIds, userId],
    }));
  }, []);

  const getDiscoverUsers = useCallback(() => {
    const seen = new Set([
      ...state.passedIds,
      ...state.blockedIds,
      ...state.matches.map((m) => m.user.id),
    ]);
    return MOCK_MATCH_USERS.filter(
      (u) => !seen.has(u.id) && state.profile.profileVisible,
    );
  }, [
    state.passedIds,
    state.blockedIds,
    state.matches,
    state.profile.profileVisible,
  ]);

  const addChatMessage = useCallback(
    (matchId: string, text: string, senderId: string) => {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        senderId,
        text,
        timestamp: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        chatMessages: {
          ...prev.chatMessages,
          [matchId]: [...(prev.chatMessages[matchId] ?? []), msg],
        },
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      updateProfile,
      completeProfile,
      passUser,
      likeUser,
      saveUser,
      blockUser,
      reportUser,
      getDiscoverUsers,
      addChatMessage,
      resetDiscoverPool,
    }),
    [
      state,
      updateProfile,
      completeProfile,
      passUser,
      likeUser,
      saveUser,
      blockUser,
      reportUser,
      getDiscoverUsers,
      addChatMessage,
      resetDiscoverPool,
    ],
  );

  return (
    <FoodMatchContext.Provider value={value}>
      {children}
    </FoodMatchContext.Provider>
  );
}

export function useFoodMatch() {
  const ctx = useContext(FoodMatchContext);
  if (!ctx) {
    throw new Error("useFoodMatch must be used within FoodMatchProvider");
  }
  return ctx;
}
