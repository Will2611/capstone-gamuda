import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Users, Heart, MessageCircle, Settings2 } from "lucide-react";
import { useFoodMatch } from "../context/FoodMatchContext";
import { useUser } from "../context/UserContext";
import { computeCompatibility } from "../data/mockFoodMatch";
import type { FoodMatch as FoodMatchType, MatchUser } from "../types/foodMatch";
import { FoodPreferenceForm } from "../components/foodMatch/FoodPreferenceForm";
import { MatchCard } from "../components/foodMatch/MatchCard";
import { MatchModal } from "../components/foodMatch/MatchModal";
import { ChatRoom } from "../components/foodMatch/ChatRoom";
import { FoodDatePlanner } from "../components/foodMatch/FoodDatePlanner";
import { FoodMatchSafetyBar } from "../components/foodMatch/FoodMatchSafetyBar";

type Tab = "discover" | "matches";

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
  } = useFoodMatch();

  const { profile: userProfile } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("discover"); //starting tab is discover
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>( //direction of the swipe
    null,
  );
  const [newMatch, setNewMatch] = useState<FoodMatchType | null>(null); //new match
  const [activeChat, setActiveChat] = useState<FoodMatchType | null>(null); //active chat
  const [plannerMatch, setPlannerMatch] = useState<FoodMatchType | null>(null); //planner match
  const [plannerOpen, setPlannerOpen] = useState(false); //planner open
  const [safetyTarget, setSafetyTarget] = useState<MatchUser | null>(null); //safety target

  const discoverUsers = getDiscoverUsers(); //get discover users
  const currentUser = discoverUsers[0] ?? null; //current user is the first user in the discover users array

  //Swipe Left to Pass
  const handlePass = () => {
    if (!currentUser) return; //if there is no current user, return
    setDragDirection("left");
    setTimeout(() => {
      passUser(currentUser.id); //pass the user
      setDragDirection(null); //reset the drag direction
      setSafetyTarget(null); //reset the safety target
    }, 300); //wait 300ms before resetting the drag direction and safety target
  };

  //Swipe Right to Like
  const handleLike = () => {
    if (!currentUser) return;
    setDragDirection("right");
    setTimeout(() => {
      const match = likeUser(currentUser);
      if (match) setNewMatch(match);
      setDragDirection(null);
      setSafetyTarget(null);
    }, 300);
  };

  //Save User to Matches
  const handleSave = () => {
    if (currentUser) saveUser(currentUser.id);
  };

  //Report User to Safety Team
  const handleReport = () => {
    const target = safetyTarget ?? currentUser;
    if (target) {
      reportUser(target.id);
      setSafetyTarget(null);
    }
  };

  //Block User from Discover Pool
  const handleBlock = () => {
    const target = safetyTarget ?? currentUser;
    if (target) {
      blockUser(target.id);
      setSafetyTarget(null);
    }
  };

  //If Profile is Not Complete, Show Preference Form
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

  const score = currentUser
    ? computeCompatibility(profile, currentUser).score
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bs-neutral-100 via-white to-bs-gold/10">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header of discover and matches tabs */}
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-bs-neutral-900 via-bs-red to-bs-gold bg-clip-text text-transparent mb-2">
            Find Your Perfect Food Buddy!
          </h1>
          <p className="text-bs-neutral-600 max-w-md mx-auto">
            Find friends, dates, and food buddies through shared taste.
          </p>
        </header>

        {/* Tabs for discover and matches */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "discover"
                ? "bg-bs-gold text-bs-neutral-900 shadow-md"
                : "bg-white/80 text-bs-neutral-600 hover:bg-white"
            }`}
          >
            <Heart className="w-4 h-4" />
            Discover
          </button>
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all relative ${
              activeTab === "matches"
                ? "bg-bs-gold text-bs-neutral-900 shadow-md"
                : "bg-white/80 text-bs-neutral-600 hover:bg-white"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Matches
            {matches.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-bs-red text-white text-xs flex items-center justify-center">
                {matches.length}
              </span>
            )}
          </button>
          <button
            onClick={() => updateProfile({ profileComplete: false })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm bg-white/80 text-bs-neutral-600 hover:bg-white transition-all"
            title="Edit preferences"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-6">
          <FoodMatchSafetyBar
            profileVisible={profile.profileVisible}
            onToggleVisibility={() =>
              updateProfile({ profileVisible: !profile.profileVisible })
            }
            onReport={handleReport}
            onBlock={handleBlock}
          />
        </div>

        {/* Discover Tab and Action */}
        {activeTab === "discover" && (
          <div className="py-4">
            {!profile.profileVisible ? (
              <div className="text-center py-16 bg-white/70 rounded-2xl border border-bs-neutral-200">
                <Users className="w-12 h-12 mx-auto text-bs-neutral-400 mb-4" />
                <p className="text-bs-neutral-600">
                  Your profile is hidden. Toggle visibility to start
                  discovering.
                </p>
              </div>
            ) : currentUser ? (
              <AnimatePresence mode="wait">
                <MatchCard
                  key={currentUser.id}
                  user={currentUser}
                  compatibilityScore={score}
                  isSaved={savedIds.includes(currentUser.id)}
                  onLike={handleLike}
                  onPass={handlePass}
                  onSave={handleSave}
                  dragDirection={dragDirection}
                />
              </AnimatePresence>
            ) : (
              <EmptyDiscoverState onReset={resetDiscoverPool} />
            )}
          </div>
        )}

        {/* Matches Tab and Action */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-16 bg-white/70 rounded-2xl border border-bs-neutral-200">
                <Heart className="w-12 h-12 mx-auto text-bs-neutral-300 mb-4" />
                <p className="text-bs-neutral-600">
                  No matches yet. Keep swiping to find your food soulmate!
                </p>
              </div> //if there are no matches, show this message
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setActiveChat(match)}
                      className="px-4 py-2 rounded-lg bg-bs-gold text-bs-neutral-900 text-sm font-medium hover:bg-[#FFE44D] transition-colors"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => {
                        setPlannerMatch(match);
                        setPlannerOpen(true);
                      }}
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
            //if there is a new match, set the active chat to the new match and set the active tab to matches
            setActiveChat(newMatch);
            setActiveTab("matches");
          }
          setNewMatch(null); //reset the new match
        }}
      />

      <ChatRoom
        match={activeChat}
        messages={activeChat ? (chatMessages[activeChat.id] ?? []) : []} //if there is an active chat, show the messages for the active chat, otherwise show an empty array
        onClose={() => setActiveChat(null)}
        onSendMessage={(text) =>
          activeChat && addChatMessage(activeChat.id, text, "me")
        }
        onPlanDate={() => {
          if (activeChat) {
            //if there is an active chat, set the planner match to the active chat and set the planner open to true
            setPlannerMatch(activeChat);
            setPlannerOpen(true);
          }
        }}
      />

      <FoodDatePlanner
        match={plannerMatch}
        isOpen={plannerOpen}
        onClose={() => {
          setPlannerOpen(false);
          setPlannerMatch(null);
        }}
      />
    </div>
  );
}

function EmptyDiscoverState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16 bg-white/70 rounded-2xl border border-bs-neutral-200">
      <Users className="w-12 h-12 mx-auto text-bs-neutral-400 mb-4" />
      <h3 className="font-semibold text-bs-neutral-900 mb-2">
        You&apos;ve seen everyone!
      </h3>
      <p className="text-bs-neutral-600 mb-4 text-sm">
        Check back later or update your preferences for new matches.
      </p>
      <button
        onClick={onReset}
        className="text-sm text-bs-gold font-medium hover:underline"
      >
        Refresh discover pool (demo)
      </button>
    </div>
  );
}
