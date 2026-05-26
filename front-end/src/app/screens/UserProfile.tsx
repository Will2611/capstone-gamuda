import { useNavigate } from "react-router";
import {
  User,
  Heart,
  History,
  Settings,
  Star,
  MapPin,
  Pencil,
} from "lucide-react";
import { ProfileCard } from "../components/ProfileCard";
import { Button } from "../components/Button";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

const PREFERENCE_LABELS: Record<string, Record<string, string>> = {
  cuisine: {
    italian: "Italian",
    mexican: "Mexican",
    asian: "Asian",
    american: "American",
    mediterranean: "Mediterranean",
    indian: "Indian",
  },
  priceRange: {
    "1": "$ Budget-friendly",
    "2": "$$ Moderate",
    "3": "$$$ Upscale",
    "4": "$$$$ Fine Dining",
  },
  dietary: {
    none: "No restrictions",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    "gluten-free": "Gluten-Free",
    halal: "Halal",
    kosher: "Kosher",
  },
  distance: {
    "1": "Within 1 mile",
    "3": "Within 3 miles",
    "5": "Within 5 miles",
    "10": "Within 10 miles",
    "20": "Within 20 miles",
  },
  ambience: {
    casual: "Casual",
    romantic: "Romantic",
    family: "Family-friendly",
    business: "Business",
    trendy: "Trendy",
    quiet: "Quiet",
  },
  time: {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    "late-night": "Late Night",
  },
};

function formatPref(key: string, value: string) {
  return PREFERENCE_LABELS[key]?.[value] ?? (value || "—");
}

export function UserProfile() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const { user } = useAuth();

  const displayName = user?.displayName ?? profile.displayName;
  const email = user?.email ?? profile.email;
  const prefs = profile.savedPreferences;

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <ProfileCard title="" className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-bs-gold/25 via-bs-red/10 to-bs-blue/15 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-bs-gold/40 border-4 border-white shadow-lg flex items-center justify-center shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-bs-neutral-700" />
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl mb-1">{displayName}</h1>
                <p className="text-bs-neutral-600">{email}</p>
                <p className="text-sm text-bs-neutral-500 mt-2">
                  Food explorer · Member since 2026
                </p>
              </div>
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => navigate("/search")}
              >
                <Pencil size={16} className="inline mr-2" />
                Edit Preferences
              </Button>
            </div>
          </div>
        </ProfileCard>

        <ProfileCard
          title="Saved Preferences"
          action={
            <Settings size={18} className="text-bs-neutral-500" />
          }
        >
          {prefs ? (
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
                <div key={key} className="bg-bs-neutral-100 rounded-lg px-4 py-3">
                  <dt className="text-xs text-bs-neutral-500 uppercase tracking-wide mb-1">
                    {label}
                  </dt>
                  <dd className="text-sm font-medium text-bs-neutral-800">
                    {formatPref(key, prefs[key])}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-bs-neutral-600 text-sm">
              No preferences saved yet.{" "}
              <button
                onClick={() => navigate("/search")}
                className="text-bs-gold hover:underline"
              >
                Set your preferences
              </button>
            </p>
          )}
        </ProfileCard>

        <ProfileCard title="Search History" action={<History size={18} className="text-bs-neutral-500" />}>
          {profile.searchHistory.length > 0 ? (
            <ul className="space-y-3">
              {profile.searchHistory.map((entry) => (
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

        <ProfileCard title="Favorite Restaurants" action={<Heart size={18} className="text-bs-red" />}>
          {profile.favoriteRestaurants.length > 0 ? (
            <ul className="space-y-3">
              {profile.favoriteRestaurants.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-bs-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
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
                    <p className="font-medium truncate">{r.name}</p>
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
