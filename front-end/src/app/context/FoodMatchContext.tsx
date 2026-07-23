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
  DatePlan,
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
  datePlans: Record<string, DatePlan>;
  /** Real nearby clients from geohash discover; empty = fall back to mocks when logged out */
  nearbyUsers: MatchUser[];
  useNearbyDiscover: boolean;
  discoverMessage: string | null;
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
  clearAllMatches: () => void;
  attachBackendMatch: (
    localMatchId: string,
    backend: {
      matchId: string;
      chatRoomId: string;
      participantId: string;
    },
  ) => void;
  setDatePlan: (localMatchId: string, plan: DatePlan) => void;
  getDatePlan: (localMatchId: string) => DatePlan | null;
  setNearbyUsers: (users: MatchUser[], message?: string | null) => void;
  setUseNearbyDiscover: (enabled: boolean) => void;
  upsertMatchFromBackend: (input: {
    user: MatchUser;
    backendMatchId: string;
    chatRoomId: string;
    matchedAt?: string | null;
  }) => FoodMatch;
  syncMatchesFromBackend: (
    items: Array<{
      user: MatchUser;
      backendMatchId: string;
      chatRoomId: string | null;
      matchedAt?: string | null;
    }>,
  ) => void;
}

const FoodMatchContext = createContext<FoodMatchContextValue | null>(null);

function createMatch(
  user: MatchUser,
  profile: FoodPreferenceProfile,
  extras?: Partial<FoodMatch>,
): FoodMatch {
  const { score, sharedInterests } = computeCompatibility(profile, user);
  const now = new Date();
  return {
    id: extras?.id ?? crypto.randomUUID(),
    user,
    compatibilityScore: score,
    sharedInterests,
    matchedAt: extras?.matchedAt ?? now.toISOString(),
    chatExpiresAt:
      extras?.chatExpiresAt ??
      new Date(now.getTime() + CHAT_DURATION_MS).toISOString(),
    saved: extras?.saved ?? false,
    backendMatchId: extras?.backendMatchId,
    chatRoomId: extras?.chatRoomId,
    backendParticipantId: extras?.backendParticipantId ?? user.id,
  };
}

const DEFAULT_STATE: FoodMatchState = {
  profile: DEFAULT_FOOD_PROFILE,
  passedIds: [],
  matches: [],
  savedIds: [],
  blockedIds: [],
  chatMessages: {},
  datePlans: {},
  nearbyUsers: [],
  useNearbyDiscover: false,
  discoverMessage: null,
};

export function FoodMatchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FoodMatchState>(DEFAULT_STATE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as FoodMatchState;
        setState({
          ...DEFAULT_STATE,
          ...parsed,
          datePlans: parsed.datePlans ?? {},
          nearbyUsers: [],
          useNearbyDiscover: false,
          discoverMessage: null,
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const { nearbyUsers: _n, useNearbyDiscover: _u, discoverMessage: _d, ...persist } =
      state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
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
      nearbyUsers: prev.nearbyUsers.filter((u) => u.id !== userId),
    }));
  }, []);

  const likeUser = useCallback((user: MatchUser): FoodMatch | null => {
    // Mock / offline path: requires likesBack
    if (!user.likesBack) {
      setState((prev) => ({
        ...prev,
        passedIds: [...prev.passedIds, user.id],
        nearbyUsers: prev.nearbyUsers.filter((u) => u.id !== user.id),
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
        nearbyUsers: prev.nearbyUsers.filter((u) => u.id !== user.id),
        chatMessages: {
          ...prev.chatMessages,
          [match.id]: [welcomeMsg],
        },
      };
    });
    return created;
  }, []);

  const upsertMatchFromBackend = useCallback(
    (input: {
      user: MatchUser;
      backendMatchId: string;
      chatRoomId: string;
      matchedAt?: string | null;
    }): FoodMatch => {
      let result: FoodMatch | null = null;
      setState((prev) => {
        const existing = prev.matches.find(
          (m) =>
            m.backendMatchId === input.backendMatchId ||
            m.user.id === input.user.id,
        );
        if (existing) {
          const updated: FoodMatch = {
            ...existing,
            user: input.user,
            backendMatchId: input.backendMatchId,
            chatRoomId: input.chatRoomId,
            backendParticipantId: input.user.id,
            matchedAt: input.matchedAt ?? existing.matchedAt,
          };
          result = updated;
          return {
            ...prev,
            matches: prev.matches.map((m) =>
              m.id === existing.id ? updated : m,
            ),
            passedIds: prev.passedIds.includes(input.user.id)
              ? prev.passedIds
              : [...prev.passedIds, input.user.id],
            nearbyUsers: prev.nearbyUsers.filter((u) => u.id !== input.user.id),
          };
        }
        const match = createMatch(input.user, prev.profile, {
          backendMatchId: input.backendMatchId,
          chatRoomId: input.chatRoomId,
          backendParticipantId: input.user.id,
          matchedAt: input.matchedAt ?? undefined,
        });
        result = match;
        const welcomeMsg: ChatMessage = {
          id: crypto.randomUUID(),
          senderId: input.user.id,
          text: `Hey! Excited to explore food together 🍽️`,
          timestamp: new Date().toISOString(),
        };
        return {
          ...prev,
          matches: [...prev.matches, match],
          passedIds: [...prev.passedIds, input.user.id],
          nearbyUsers: prev.nearbyUsers.filter((u) => u.id !== input.user.id),
          chatMessages: {
            ...prev.chatMessages,
            [match.id]: prev.chatMessages[match.id] ?? [welcomeMsg],
          },
        };
      });
      return result!;
    },
    [],
  );

  const syncMatchesFromBackend = useCallback(
    (
      items: Array<{
        user: MatchUser;
        backendMatchId: string;
        chatRoomId: string | null;
        matchedAt?: string | null;
      }>,
    ) => {
      setState((prev) => {
        const byBackend = new Map(
          prev.matches
            .filter((m) => m.backendMatchId)
            .map((m) => [m.backendMatchId!, m]),
        );
        const byUser = new Map(prev.matches.map((m) => [m.user.id, m]));
        const next: FoodMatch[] = [];
        const seenLocal = new Set<string>();

        for (const item of items) {
          const existing =
            byBackend.get(item.backendMatchId) ?? byUser.get(item.user.id);
          if (existing) {
            seenLocal.add(existing.id);
            next.push({
              ...existing,
              user: item.user,
              backendMatchId: item.backendMatchId,
              chatRoomId: item.chatRoomId ?? existing.chatRoomId,
              backendParticipantId: item.user.id,
              matchedAt: item.matchedAt ?? existing.matchedAt,
            });
          } else {
            const created = createMatch(item.user, prev.profile, {
              backendMatchId: item.backendMatchId,
              chatRoomId: item.chatRoomId ?? undefined,
              backendParticipantId: item.user.id,
              matchedAt: item.matchedAt ?? undefined,
            });
            seenLocal.add(created.id);
            next.push(created);
          }
        }

        // Keep local-only (mock) matches that have no backend id
        for (const m of prev.matches) {
          if (!m.backendMatchId && !seenLocal.has(m.id)) {
            next.push(m);
          }
        }

        return { ...prev, matches: next };
      });
    },
    [],
  );

  const resetDiscoverPool = useCallback(() => {
    setState((prev) => ({ ...prev, passedIds: [] }));
  }, []);

  const clearAllMatches = useCallback(() => {
    setState((prev) => ({
      ...prev,
      matches: [],
      passedIds: [],
      chatMessages: {},
      datePlans: {},
      savedIds: [],
    }));
  }, []);

  const setNearbyUsers = useCallback(
    (users: MatchUser[], message?: string | null) => {
      setState((prev) => ({
        ...prev,
        nearbyUsers: users,
        useNearbyDiscover: true,
        discoverMessage: message ?? null,
      }));
    },
    [],
  );

  const setUseNearbyDiscover = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      useNearbyDiscover: enabled,
      nearbyUsers: enabled ? prev.nearbyUsers : [],
      discoverMessage: enabled ? prev.discoverMessage : null,
    }));
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
      nearbyUsers: prev.nearbyUsers.filter((u) => u.id !== userId),
    }));
  }, []);

  const reportUser = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      blockedIds: [...prev.blockedIds, userId],
      passedIds: [...prev.passedIds, userId],
      nearbyUsers: prev.nearbyUsers.filter((u) => u.id !== userId),
    }));
  }, []);

  const getDiscoverUsers = useCallback(() => {
    const seen = new Set([
      ...state.passedIds,
      ...state.blockedIds,
      ...state.matches.map((m) => m.user.id),
    ]);
    if (state.useNearbyDiscover) {
      return state.nearbyUsers.filter(
        (u) => !seen.has(u.id) && state.profile.profileVisible,
      );
    }
    return MOCK_MATCH_USERS.filter(
      (u) => !seen.has(u.id) && state.profile.profileVisible,
    );
  }, [
    state.passedIds,
    state.blockedIds,
    state.matches,
    state.profile.profileVisible,
    state.nearbyUsers,
    state.useNearbyDiscover,
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

  const attachBackendMatch = useCallback(
    (
      localMatchId: string,
      backend: { matchId: string; chatRoomId: string; participantId: string },
    ) => {
      setState((prev) => ({
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === localMatchId
            ? {
                ...m,
                backendMatchId: backend.matchId,
                chatRoomId: backend.chatRoomId,
                backendParticipantId: backend.participantId,
              }
            : m,
        ),
      }));
    },
    [],
  );

  const setDatePlan = useCallback((localMatchId: string, plan: DatePlan) => {
    setState((prev) => ({
      ...prev,
      datePlans: { ...prev.datePlans, [localMatchId]: plan },
    }));
  }, []);

  const getDatePlan = useCallback(
    (localMatchId: string) => state.datePlans[localMatchId] ?? null,
    [state.datePlans],
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
      clearAllMatches,
      attachBackendMatch,
      setDatePlan,
      getDatePlan,
      setNearbyUsers,
      setUseNearbyDiscover,
      upsertMatchFromBackend,
      syncMatchesFromBackend,
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
      clearAllMatches,
      attachBackendMatch,
      setDatePlan,
      getDatePlan,
      setNearbyUsers,
      setUseNearbyDiscover,
      upsertMatchFromBackend,
      syncMatchesFromBackend,
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
