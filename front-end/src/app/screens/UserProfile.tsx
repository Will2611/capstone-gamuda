import { useEffect } from "react";
import { useNavigate } from "react-router";
import {
  User,
  Heart,
  History,
  Settings,
  Star,
  MapPin,
  Pencil,
  Calendar,
  Languages,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ProfileCard } from "../components/ProfileCard";
import { Button } from "../components/Button";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import {
  CUISINE_OPTIONS,
  PRICE_OPTIONS,
  DIETARY_OPTIONS,
  DISTANCE_OPTIONS,
  AMBIENCE_OPTIONS,
  TIME_OPTIONS,
  GENDER_OPTIONS,
  LANG_OPTIONS,
} from "../components/config/FilterOption";
import type { SearchPreferences } from "../types/user";

// Helper: convert [{value, label}] array into a value->label lookup map
const optionsToLookupMap = (options: Array<{ value: string; label: string }>) =>
  options.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<string, string>,
  );

// Lookup maps derived from the shared FilterOption constants
const PREFERENCE_LABELS: Record<string, Record<string, string>> = {
  cuisine: optionsToLookupMap(CUISINE_OPTIONS),
  priceRange: optionsToLookupMap(PRICE_OPTIONS),
  dietary: optionsToLookupMap(DIETARY_OPTIONS),
  distance: optionsToLookupMap(DISTANCE_OPTIONS),
  ambience: optionsToLookupMap(AMBIENCE_OPTIONS),
  time: optionsToLookupMap(TIME_OPTIONS),
};

const GENDER_LABELS = optionsToLookupMap(GENDER_OPTIONS);
const LANG_LABELS = optionsToLookupMap(LANG_OPTIONS);

export default function UserProfile() {
  const navigate = useNavigate();
  const { profile, profileLoading, profileError } = useUser();
  const { user } = useAuth();

  // Redirect non-client users away
  useEffect(() => {
    if (user && user.role !== "client") {
      if (user.role === "owner") {
        navigate("/owner/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [user, navigate]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-bs-neutral-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-bs-neutral-700 font-medium">
          <Loader2 className="animate-spin" size={24} />
          Loading your profile...
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-bs-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={40} />
          <h2 className="text-lg font-semibold text-bs-neutral-900">
            Failed to Load Profile
          </h2>
          <p className="text-sm text-bs-neutral-600">{profileError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const renderPrefValue = (
    key: string,
    value: string | string[] | undefined,
  ) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-bs-neutral-400">Any / Unspecified</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-bs-gold/10 text-bs-gold border border-bs-gold/20"
            >
              {PREFERENCE_LABELS[key]?.[v] ?? v}
            </span>
          ))}
        </div>
      );
    }

    return (
      <p className="text-sm font-medium text-bs-neutral-800 mt-1">
        {PREFERENCE_LABELS[key]?.[value] ?? value}
      </p>
    );
  };

  const prefs = profile.savedPreferences as Partial<SearchPreferences> | null;
  const personalities = profile.personalities ?? [];
  const searchHistory = profile.searchHistory ?? [];
  const favoriteRestaurants = profile.favoriteRestaurants ?? [];

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <ProfileCard title="" className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-bs-gold/25 via-bs-red/10 to-bs-blue/15 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-bs-gold/40 border-4 border-white shadow-lg flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-bs-neutral-700" />
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl mb-1 font-semibold text-bs-neutral-900">
                  {profile.displayName}
                </h1>
                <p className="text-bs-neutral-600 text-sm">{profile.email}</p>
                <p className="text-xs text-bs-neutral-500 mt-2">
                  Food explorer · Client Account
                </p>
              </div>

              <Button
                variant="secondary"
                className="shrink-0 text-xs py-2"
                onClick={() => navigate("/signup?mode=edit")}
              >
                <Pencil size={14} className="inline mr-1.5" />
                Edit Preferences
              </Button>
            </div>

            {(profile.gender ||
              profile.birthday ||
              profile.religion ||
              profile.language) && (
              <div className="mt-6 pt-6 border-t border-black/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-white/40 p-4 rounded-xl backdrop-blur-sm">
                <div>
                  <p className="text-xs text-bs-neutral-500 uppercase font-medium">
                    Gender
                  </p>
                  <p className="font-medium text-bs-neutral-800 capitalize">
                    {GENDER_LABELS[profile.gender || ""] ||
                      profile.gender ||
                      "Unspecified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-bs-neutral-500 uppercase font-medium flex items-center gap-1">
                    <Calendar size={12} /> Birthday
                  </p>
                  <p className="font-medium text-bs-neutral-800">
                    {profile.birthday || "Unspecified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-bs-neutral-500 uppercase font-medium">
                    Religion
                  </p>
                  <p className="font-medium text-bs-neutral-800">
                    {profile.religion || "Unspecified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-bs-neutral-500 uppercase font-medium flex items-center gap-1">
                    <Languages size={12} /> Language
                  </p>
                  <p className="font-medium text-bs-neutral-800">
                    {LANG_LABELS[profile.language || ""] ||
                      profile.language ||
                      "Unspecified"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ProfileCard>

        <ProfileCard
          title="Saved Preferences"
          action={<Settings size={18} className="text-bs-neutral-500" />}
        >
          {prefs ? (
            <div className="space-y-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    ["Cuisine", "cuisine"],
                    ["Price Range", "priceRange"],
                    ["Dietary", "dietary"],
                    ["Max Distance", "distance"],
                    ["Ambience", "ambience"],
                    ["Visit Time", "time"],
                  ] as const
                ).map(([label, key]) => (
                  <div
                    key={key}
                    className="bg-bs-neutral-100/60 border border-bs-neutral-200/50 rounded-lg px-4 py-3 flex flex-col justify-between"
                  >
                    <dt className="text-xs text-bs-neutral-500 uppercase tracking-wide font-medium">
                      {label}
                    </dt>
                    <dd>{renderPrefValue(key, (prefs as any)[key])}</dd>
                  </div>
                ))}
              </dl>

              {personalities.length > 0 && (
                <div className="pt-4 border-t border-bs-neutral-200">
                  <dt className="text-xs text-bs-neutral-500 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1">
                    <Sparkles size={14} className="text-bs-blue" /> Food
                    Personality
                  </dt>
                  <dd className="flex flex-wrap gap-2">
                    {personalities.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-bs-blue/10 text-bs-blue border border-bs-blue/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </div>
          ) : (
            <p className="text-bs-neutral-600 text-sm">
              No preferences saved yet.{" "}
              <button
                onClick={() => navigate("/signup?mode=edit")}
                className="text-bs-gold hover:underline font-medium"
              >
                Set your preferences
              </button>
            </p>
          )}
        </ProfileCard>

        <ProfileCard
          title="Search History"
          action={<History size={18} className="text-bs-neutral-500" />}
        >
          {searchHistory.length > 0 ? (
            <ul className="space-y-3">
              {searchHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg bg-bs-neutral-100 hover:bg-bs-neutral-200/80 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-bs-neutral-900">
                      {entry.query}
                    </p>
                    <p className="text-xs text-bs-neutral-500 mt-1">
                      {entry.date}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/map")}
                    className="text-xs text-bs-gold hover:underline shrink-0"
                  >
                    View map
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bs-neutral-600">No searches yet.</p>
          )}
        </ProfileCard>

        <ProfileCard
          title="Favorite Restaurants"
          action={<Heart size={18} className="text-bs-red" />}
        >
          {favoriteRestaurants.length > 0 ? (
            <ul className="space-y-3">
              {favoriteRestaurants.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-bs-neutral-200 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => navigate("/map")}
                >
                  {r.image && (
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-bs-neutral-900">
                      {r.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-bs-neutral-600 mt-1">
                      <span className="flex items-center gap-0.5">
                        <Star size={12} className="text-bs-gold fill-bs-gold" />
                        {r.rating}
                      </span>
                      <span>{r.cuisine}</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={12} />
                        {r.distance}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bs-neutral-600">
              Save restaurants from the map to see them here.
            </p>
          )}
        </ProfileCard>

        <div className="flex justify-center pt-2">
          <Button onClick={() => navigate("/map")}>Find Restaurants</Button>
        </div>
      </div>
    </div>
  );
}
