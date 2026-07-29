import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Users,
  Heart,
  MessageCircle,
  Settings2,
  X,
  Calendar,
} from "lucide-react";
import { useFoodMatch } from "../context/FoodMatchContext";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { computeCompatibility } from "../data/mockFoodMatch";
import type { FoodMatch as FoodMatchType, MatchUser } from "../types/foodMatch";
import { FoodPreferenceForm } from "../components/foodMatch/FoodPreferenceForm";
import { MatchCard } from "../components/foodMatch/MatchCard";
import { MatchModal } from "../components/foodMatch/MatchModal";
import { AvailabilityModal } from "../components/foodMatch/AvailabilityModal";
import { DatePlanStatusPanel } from "../components/foodMatch/DatePlanStatusPanel";
import { RestaurantRecommendationPopup } from "../components/foodMatch/RestaurantRecommendationPopup";
import { FoodMatchSafetyBar } from "../components/foodMatch/FoodMatchSafetyBar";
import ChatBoxPanel from "../components/ChatBoxPanel";
import {
  acceptDatePlan,
  acceptSuggestion,
  buildChatSocketUrl,
  clearFoodMatches,
  createDatePlan,
  discoverNearby,
  ensureMatch,
  getDatePlan,
  likeNearbyUser,
  listFoodMatches,
  nextRestaurant,
  recommendRestaurants,
  submitAvailability,
  toMatchUser,
  updateFoodMatchLocation,
} from "../services/datePlanApi";

type Tab = "discover" | "matches";

async function readGeolocation(): Promise<GeolocationPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export default function FoodMatch() {
  const {
    profile,
    updateProfile,
    completeProfile,
    passUser,
    likeUser,
    saveUser,
    blockUser,
    reportUser,
    getDiscoverUsers,
    matches,
    savedIds,
    chatMessages,
    addChatMessage,
    resetDiscoverPool,
    clearAllMatches,
    attachBackendMatch,
    setDatePlan,
    datePlans,
    setNearbyUsers,
    setUseNearbyDiscover,
    upsertMatchFromBackend,
    syncMatchesFromBackend,
    discoverMessage,
    useNearbyDiscover,
  } = useFoodMatch();

  const { profile: userProfile } = useUser();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [newMatch, setNewMatch] = useState<FoodMatchType | null>(null);
  const [activeChat, setActiveChat] = useState<FoodMatchType | null>(null);
  const [plannerMatch, setPlannerMatch] = useState<FoodMatchType | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [safetyTarget, setSafetyTarget] = useState<MatchUser | null>(null);

  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [cycling, setCycling] = useState(false);
  const [acceptingSuggestion, setAcceptingSuggestion] = useState(false);
  const [discoverBusy, setDiscoverBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);

  const discoverUsers = getDiscoverUsers();
  const currentUser = discoverUsers[0] ?? null;

  const refreshNearby = useCallback(async () => {
    if (!isAuthenticated) {
      setUseNearbyDiscover(false);
      return;
    }
    setDiscoverBusy(true);
    try {
      const pos = await readGeolocation();
      if (pos) {
        await updateFoodMatchLocation(
          pos.coords.latitude,
          pos.coords.longitude,
        );
      }
      const discovered = await discoverNearby();
      setNearbyUsers(
        discovered.users.map(toMatchUser),
        discovered.message ?? null,
      );

      const remoteMatches = await listFoodMatches();
      syncMatchesFromBackend(
        remoteMatches.map((m) => ({
          user: toMatchUser(m.participant),
          backendMatchId: m.match_id,
          chatRoomId: m.chat_room_id ?? null,
          matchedAt: m.matched_at,
        })),
      );
    } catch (err) {
      console.error("Nearby discover failed", err);
      setNearbyUsers(
        [],
        "Could not load nearby buddies. Check that you are logged in and location is enabled.",
      );
    } finally {
      setDiscoverBusy(false);
    }
  }, [
    isAuthenticated,
    setNearbyUsers,
    setUseNearbyDiscover,
    syncMatchesFromBackend,
  ]);

  useEffect(() => {
    if (!profile.profileComplete) return;
    void refreshNearby();
  }, [profile.profileComplete, refreshNearby]);

  interface PushEventMessage<T = any> {
    type: string;
    payload: T;
    timestamp: Date;
  }

  const handlePushEventMatch = (ev: MessageEvent<PushEventMessage>) => {
    const { type, payload } = ev.data;

    if (type === "PUSH_RECEIVED") {
      const { isMatched } = payload;
      if (isMatched) {
        void refreshNearby();
      }
    }
  };
  useEffect(() => {
    const cleanUp: (() => void)[] = [];
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handlePushEventMatch);
      cleanUp.push(() => {
        navigator.serviceWorker.removeEventListener(
          "message",
          handlePushEventMatch,
        );
      });
    }
    return () => {
      cleanUp.forEach((fn) => fn());
    };
  }, []);

  const handleClearMatches = useCallback(async () => {
    if (
      !window.confirm(
        "Clear all matches, likes, and date plans? You can swipe the same people again.",
      )
    ) {
      return;
    }
    setClearBusy(true);
    try {
      if (isAuthenticated) {
        await clearFoodMatches();
      }
      clearAllMatches();
      setActiveChat(null);
      setPlannerMatch(null);
      setPlannerOpen(false);
      setNewMatch(null);
      if (isAuthenticated) {
        await refreshNearby();
      }
    } catch (err) {
      console.error(err);
      window.alert("Failed to clear matches. Check the console for details.");
    } finally {
      setClearBusy(false);
    }
  }, [clearAllMatches, isAuthenticated, refreshNearby]);

  const activePlan = activeChat ? datePlans[activeChat.id] : null;
  const plannerPlan = plannerMatch ? datePlans[plannerMatch.id] : null;

  const resolveBackendMatch = useCallback(
    async (match: FoodMatchType) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to plan a food date.");
      }
      if (match.backendMatchId && match.chatRoomId) {
        return {
          matchId: match.backendMatchId,
          chatRoomId: match.chatRoomId,
          participantId: match.backendParticipantId || match.user.id,
        };
      }
      const lat = await readGeolocation();

      const ensured = await ensureMatch(
        match.user,
        lat?.coords.latitude,
        lat?.coords.longitude,
      );
      attachBackendMatch(match.id, {
        matchId: ensured.match_id,
        chatRoomId: ensured.chat_room_id,
        participantId: ensured.participant_id,
      });
      return {
        matchId: ensured.match_id,
        chatRoomId: ensured.chat_room_id,
        participantId: ensured.participant_id,
      };
    },
    [isAuthenticated, attachBackendMatch],
  );

  const openPlanner = async (match: FoodMatchType) => {
    setPlanError(null);
    setPlannerMatch(match);
    if (!isAuthenticated) {
      setPlanError("Please log in to plan a food date with real match IDs.");
      setPlannerOpen(true);
      return;
    }
    setPlanBusy(true);
    try {
      const backend = await resolveBackendMatch(match);
      const plan = await createDatePlan(backend.matchId);
      setDatePlan(match.id, plan);
      setPlannerOpen(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (err as Error)?.message ||
        "Could not start date plan";
      setPlanError(String(msg));
      setPlannerOpen(true);
    } finally {
      setPlanBusy(false);
    }
  };

  const handleAvailabilitySubmit = async (payload: {
    available_date: string;
    start_time: string;
    end_time: string;
  }) => {
    if (!plannerMatch || !isAuthenticated) {
      setPlanError("Please log in to submit availability.");
      return;
    }
    setPlanBusy(true);
    setPlanError(null);
    try {
      let plan = datePlans[plannerMatch.id];
      if (!plan) {
        const backend = await resolveBackendMatch(plannerMatch);
        plan = await createDatePlan(backend.matchId);
        setDatePlan(plannerMatch.id, plan);
      }
      const updated = await submitAvailability(plan.id, payload);
      setDatePlan(plannerMatch.id, updated);
      setPlannerOpen(false);
      setActiveChat(plannerMatch);
      setActiveTab("matches");

      if (
        updated.status === "overlap_found" ||
        updated.status === "recommending"
      ) {
        // Poll until restaurant ready
        void pollRecommendation(plannerMatch.id, updated.id);
      }
      if (updated.status === "restaurant_ready") {
        setPopupOpen(true);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (err as Error)?.message ||
        "Failed to submit availability";
      setPlanError(String(msg));
    } finally {
      setPlanBusy(false);
    }
  };

  const pollRecommendation = async (localMatchId: string, planId: string) => {
    if (!isAuthenticated) return;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        let plan = await getDatePlan(planId);
        if (plan.status === "overlap_found") {
          // Trigger recommend if background didn't finish
          plan = await recommendRestaurants(planId);
        }
        setDatePlan(localMatchId, plan);
        if (plan.status === "restaurant_ready") {
          setPopupOpen(true);
          return;
        }
        if (
          plan.status === "overlap_found" &&
          (plan.candidate_count ?? 0) === 0
        ) {
          return;
        }
      } catch {
        /* retry */
      }
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!activeChat || !isAuthenticated || !activePlan) return;
    setAcceptingSuggestion(true);
    try {
      const updated = await acceptSuggestion(activePlan.id);
      setDatePlan(activeChat.id, updated);
      void pollRecommendation(activeChat.id, updated.id);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setAcceptingSuggestion(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!activeChat || !isAuthenticated || !activePlan) return;
    setAccepting(true);
    try {
      const updated = await acceptDatePlan(activePlan.id);
      setDatePlan(activeChat.id, updated);
    } finally {
      setAccepting(false);
    }
  };

  const handleChooseAnother = async () => {
    if (!activeChat || !isAuthenticated || !activePlan) return;
    setCycling(true);
    try {
      const updated = await nextRestaurant(activePlan.id, activePlan.version);
      setDatePlan(activeChat.id, updated);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setCycling(false);
    }
  };

  // Sync activeChat reference when matches update (backend ids attached)
  useEffect(() => {
    if (!activeChat) return;
    const fresh = matches.find((m) => m.id === activeChat.id);
    if (fresh && fresh !== activeChat) setActiveChat(fresh);
  }, [matches, activeChat]);

  // Live date-plan events on the match chat room
  useEffect(() => {
    if (!activeChat?.chatRoomId || !isAuthenticated) return;
    const url = buildChatSocketUrl(activeChat.chatRoomId);
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        const planEvents = new Set([
          "availability_submitted",
          "availability_updated",
          "overlap_found",
          "no_overlap",
          "restaurant_ready",
          "restaurant_cycled",
          "date_confirmed",
          "plan_accepted",
          "plan_cancelled",
        ]);
        if (!planEvents.has(data.type)) return;
        const payload = data.payload;
        if (payload?.id && payload?.status) {
          setDatePlan(activeChat.id, payload);
          if (payload.status === "restaurant_ready") setPopupOpen(true);
        } else if (payload?.plan_id && isAuthenticated) {
          void getDatePlan(payload.plan_id).then((plan) => {
            setDatePlan(activeChat.id, plan);
            if (plan.status === "restaurant_ready") setPopupOpen(true);
          });
        }
      } catch {
        /* ignore */
      }
    };
    return () => ws.close();
  }, [activeChat?.id, activeChat?.chatRoomId, isAuthenticated, setDatePlan]);

  const handlePass = () => {
    if (!currentUser || likeBusy) return;
    setTimeout(() => {
      passUser(currentUser.id);
      setSafetyTarget(null);
    }, 300);
  };

  const handleLike = () => {
    if (!currentUser || likeBusy) return;
    void (async () => {
      setLikeBusy(true);
      try {
        if (isAuthenticated && useNearbyDiscover) {
          const result = await likeNearbyUser(currentUser.id);
          passUser(currentUser.id);
          if (result.matched && result.match_id && result.chat_room_id) {
            const partner = result.participant
              ? toMatchUser(result.participant)
              : currentUser;
            const match = upsertMatchFromBackend({
              user: partner,
              backendMatchId: result.match_id,
              chatRoomId: result.chat_room_id,
            });
            setNewMatch(match);
          }
        } else {
          const match = likeUser(currentUser);
          if (match) setNewMatch(match);
        }
      } catch (err) {
        console.error(err);
        passUser(currentUser.id);
      } finally {
        setLikeBusy(false);
        setSafetyTarget(null);
      }
    })();
  };

  const handleSave = () => {
    if (currentUser) saveUser(currentUser.id);
  };

  const handleReport = () => {
    const target = safetyTarget ?? currentUser;
    if (target) {
      reportUser(target.id);
      setSafetyTarget(null);
    }
  };

  const handleBlock = () => {
    const target = safetyTarget ?? currentUser;
    if (target) {
      blockUser(target.id);
      setSafetyTarget(null);
    }
  };

  const socketUrl =
    activeChat?.chatRoomId && isAuthenticated
      ? buildChatSocketUrl(activeChat.chatRoomId)
      : null;

  const activeDummyChat = useMemo(() => {
    if (!activeChat) return undefined;
    return {
      chatGroupName: activeChat.user.name,
      avatarUrl: activeChat.user.avatarUrl,
      expiresAt: activeChat.chatExpiresAt,
      messages: (chatMessages[activeChat.id] ?? []).map((v) => {
        const isSelf = v.senderId === (user?.id ?? "0");
        return {
          id: v.id,
          userId: v.senderId,
          userName: isSelf ? userProfile.displayName : activeChat.user.name,
          userType: "client" as const,
          timestamp: new Date(v.timestamp),
          message: v.text,
        };
      }),
      participants: [
        {
          id: activeChat.user.id,
          displayName: activeChat.user.name,
          avatarUrl: activeChat.user.avatarUrl,
          type: "client" as const,
          dummyResponses: socketUrl
            ? []
            : [
                "Can't wait to try somewhere new!",
                "That time works for me — let's lock it in.",
                "I'm free this weekend for a food date!",
              ],
        },
      ],
    };
  }, [activeChat, chatMessages, user?.id, userProfile.displayName, socketUrl]);

  useEffect(() => {
    if (userProfile && !profile.profileComplete) {
      const { savedPreferences, personalities } = userProfile;

      const halal =
        (savedPreferences?.dietary &&
          savedPreferences.dietary.findIndex((v) => v === "halal") > 0) ||
        false;
      const vegetarian =
        (savedPreferences?.dietary &&
          savedPreferences.dietary.findIndex(
            (v) => v === "vegetarian" || v === "vegan",
          ) >= 0) ||
        false;
      updateProfile({
        favoriteFoods: [],
        personalityTags: personalities,
        // ...(userProfile.savedPreferences?.priceRange
        //   ? { budgetRange: [userProfile.savedPreferences?.priceRange] }
        //   : {}),
        halal,
        vegetarian,
        preferredDiningTime: savedPreferences?.time,
      });
    }
  }, [userProfile]);

  if (!profile.profileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bs-neutral-100 via-white to-bs-gold/10 py-12 px-4">
        <FoodPreferenceForm
          profile={profile}
          onUpdate={updateProfile}
          onComplete={completeProfile}
        />
      </div>
    );
  }

  const displayPlan = activePlan ?? plannerPlan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bs-neutral-100 via-white to-bs-gold/10 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-bs-neutral-900">
              Food Buddy
            </h1>
            <p className="text-sm text-bs-neutral-600">
              {isAuthenticated
                ? "Nearby · Match · Plan a food date"
                : "Match · Chat · Plan a food date (log in for nearby)"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateProfile({ profileVisible: !profile.profileVisible })
            }
            className="p-2 rounded-lg hover:bg-white/60"
            title="Visibility"
          >
            <Settings2 className="w-5 h-5 text-bs-neutral-700" />
          </button>
        </div>

        <FoodMatchSafetyBar
          profileVisible={profile.profileVisible}
          onToggleVisibility={() =>
            updateProfile({ profileVisible: !profile.profileVisible })
          }
          onReport={handleReport}
          onBlock={handleBlock}
        />

        <div className="flex gap-2 mb-6 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("discover")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "discover"
                ? "bg-bs-gold text-bs-neutral-900"
                : "bg-white/70 text-bs-neutral-600"
            }`}
          >
            <Users className="w-4 h-4 inline mr-1.5" />
            Discover
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matches")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "matches"
                ? "bg-bs-gold text-bs-neutral-900"
                : "bg-white/70 text-bs-neutral-600"
            }`}
          >
            <Heart className="w-4 h-4 inline mr-1.5" />
            Matches ({matches.length})
          </button>
        </div>

        {activeTab === "discover" && (
          <div>
            {discoverBusy && (
              <p className="text-sm text-bs-neutral-600 mb-3 text-center">
                Finding food buddies near you…
              </p>
            )}
            {!discoverBusy && discoverMessage && !currentUser && (
              <p className="text-sm text-bs-neutral-600 mb-3 text-center">
                {discoverMessage}
              </p>
            )}
            {currentUser ? (
              <AnimatePresence mode="wait">
                <MatchCard
                  key={currentUser.id}
                  user={currentUser}
                  compatibilityScore={
                    computeCompatibility(profile, currentUser).score
                  }
                  isSaved={savedIds.includes(currentUser.id)}
                  onLike={handleLike}
                  onPass={handlePass}
                  onSave={handleSave}
                />
              </AnimatePresence>
            ) : (
              <EmptyDiscoverState
                onReset={() => {
                  if (isAuthenticated) void refreshNearby();
                  else resetDiscoverPool();
                }}
                isNearby={useNearbyDiscover}
                isLoggedIn={isAuthenticated}
              />
            )}
          </div>
        )}

        {activeTab === "matches" && (
          <div className="space-y-4">
            {(matches.length > 0 || isAuthenticated) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleClearMatches()}
                  disabled={clearBusy}
                  className="text-sm text-bs-neutral-500 hover:text-bs-neutral-800 underline disabled:opacity-50"
                >
                  {clearBusy ? "Clearing…" : "Clear my matches"}
                </button>
              </div>
            )}
            {matches.length === 0 ? (
              <div className="text-center py-16 bg-white/70 rounded-2xl border border-bs-neutral-200">
                <Heart className="w-12 h-12 mx-auto text-bs-neutral-300 mb-4" />
                <p className="text-bs-neutral-600">
                  No matches yet. Keep swiping to find your food soulmate!
                </p>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-bs-neutral-200 shadow-md hover:shadow-lg transition-shadow"
                >
                  <img
                    src={match.user.avatarUrl}
                    alt={match.user.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-bs-gold"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-bs-neutral-900">
                      {match.user.name}
                    </h3>
                    <p className="text-sm text-bs-gold font-medium">
                      {match.compatibilityScore}% match
                    </p>
                    <p className="text-xs text-bs-neutral-500 truncate">
                      {match.sharedInterests.slice(0, 3).join(" · ")}
                    </p>
                    {match.backendMatchId && (
                      <p className="text-[10px] text-bs-green mt-0.5">
                        Synced · room ready
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveChat(match)}
                      className="px-4 py-2 rounded-lg bg-bs-gold text-bs-neutral-900 text-sm font-medium hover:bg-[#FFE44D] transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => void openPlanner(match)}
                      className="px-4 py-2 rounded-lg border border-bs-red text-bs-red text-sm hover:bg-bs-red/10 transition-colors"
                    >
                      Plan Food Date
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <MatchModal
        match={newMatch}
        currentUserAvatar={userProfile.avatarUrl}
        onClose={() => setNewMatch(null)}
        onStartChat={() => {
          if (newMatch) {
            setActiveChat(newMatch);
            setActiveTab("matches");
          }
          setNewMatch(null);
        }}
      />

      {activeChat && (
        <div className="fixed inset-0 md:left-[calc(100vw-32rem)] md:w-md z-[56] md:top-[45vh] flex flex-col">
          <div className="flex-1 min-h-0">
            <ChatBoxPanel
              socketUrl={socketUrl}
              dummyChat={activeDummyChat}
              onSendMessage={(text) => {
                addChatMessage(activeChat.id, text, user?.id ?? "0");
              }}
              onReceiveMessage={(text, senderId) => {
                addChatMessage(
                  activeChat.id,
                  text,
                  senderId || activeChat.user.id,
                );
              }}
              height={"50vh"}
            >
              <button
                type="button"
                onClick={() => void openPlanner(activeChat)}
                className="p-2 rounded-lg bg-bs-gold/20 hover:bg-bs-gold/40 transition-colors"
                title="Plan Food Date"
              >
                <Calendar className="w-5 h-5 text-bs-neutral-800" />
              </button>
              <button
                type="button"
                onClick={() => setActiveChat(null)}
                className="p-2 rounded-lg hover:bg-bs-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </ChatBoxPanel>
          </div>
          {activePlan && (
            <div className="bg-white/95 border-t border-bs-neutral-200 max-h-[40vh] overflow-y-auto">
              <DatePlanStatusPanel
                plan={activePlan}
                onEditAvailability={() => {
                  setPlannerMatch(activeChat);
                  setPlannerOpen(true);
                }}
                onAcceptSuggestion={() => void handleAcceptSuggestion()}
                onOpenRecommendation={() => setPopupOpen(true)}
                acceptingSuggestion={acceptingSuggestion}
              />
            </div>
          )}
        </div>
      )}

      <AvailabilityModal
        match={plannerMatch}
        isOpen={plannerOpen}
        isSubmitting={planBusy}
        error={planError}
        onClose={() => {
          setPlannerOpen(false);
          setPlanError(null);
        }}
        onSubmit={(p) => void handleAvailabilitySubmit(p)}
      />

      <RestaurantRecommendationPopup
        plan={displayPlan}
        isOpen={popupOpen && Boolean(displayPlan?.recommendation)}
        onClose={() => setPopupOpen(false)}
        onAccept={() => void handleAcceptPlan()}
        onChooseAnother={() => void handleChooseAnother()}
        accepting={accepting}
        cycling={cycling}
        currentUserId={user?.id}
      />
    </div>
  );
}

function EmptyDiscoverState({
  onReset,
  isNearby,
  isLoggedIn,
}: {
  onReset: () => void;
  isNearby: boolean;
  isLoggedIn: boolean;
}) {
  return (
    <div className="text-center py-16 bg-white/70 rounded-2xl border border-bs-neutral-200">
      <Users className="w-12 h-12 mx-auto text-bs-neutral-400 mb-4" />
      <h3 className="font-semibold text-bs-neutral-900 mb-2">
        {isNearby ? "No one nearby right now" : "You've seen everyone!"}
      </h3>
      <p className="text-bs-neutral-600 mb-4 text-sm px-6">
        {isNearby
          ? "Make sure location is on and another client nearby has Food Buddy visibility enabled."
          : isLoggedIn
            ? "Check back later or update your preferences for new matches."
            : "Log in to discover real food buddies near you via geohash."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-sm text-bs-gold font-medium hover:underline"
      >
        {isNearby ? "Refresh nearby" : "Refresh discover pool (demo)"}
      </button>
    </div>
  );
}
