import type {
  FoodPreferenceProfile,
  MatchUser,
  SuggestedRestaurant,
} from "../types/foodMatch";

export const FAVORITE_FOOD_OPTIONS = [
  "Sushi",
  "Korean BBQ",
  "Burgers",
  "Pizza",
  "Hotpot",
  "Dessert",
  "Coffee",
  "Vegan",
  "Seafood",
  "Spicy Food",
  "Ramen",
  "Japanese",
] as const;

export const PERSONALITY_TAG_OPTIONS = [
  "Adventurous eater",
  "Cafe hopper",
  "Fine dining lover",
  "Street food hunter",
  "Late night foodie",
  "Healthy eater",
  "Dessert addict",
] as const;

export const BUDGET_OPTIONS = [
  { value: "budget", label: "$ Budget-friendly" },
  { value: "moderate", label: "$$ Moderate" },
  { value: "upscale", label: "$$$ Upscale" },
  { value: "splurge", label: "$$$$ Splurge" },
];

export const DINING_TIME_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "brunch", label: "Brunch" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "late-night", label: "Late night" },
];

export const MEETUP_DISTANCE_OPTIONS = [
  { value: "1km", label: "Within 1 km" },
  { value: "3km", label: "Within 3 km" },
  { value: "5km", label: "Within 5 km" },
  { value: "10km", label: "Within 10 km" },
];

export const LOOKING_FOR_LABELS: Record<string, string> = {
  friend: "Looking for Friend",
  relationship: "Looking for Relationship",
  "food-buddy": "Looking for Food Buddy",
};

export const DEFAULT_FOOD_PROFILE: FoodPreferenceProfile = {
  favoriteFoods: [],
  personalityTags: [],
  budgetRange: "moderate",
  halal: false,
  vegetarian: false,
  preferredDiningTime: "dinner",
  meetupDistance: "5km",
  profileComplete: false,
  profileVisible: true,
};

export const MOCK_MATCH_USERS: MatchUser[] = [
  {
    id: "1",
    name: "Maya",
    age: 24,
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
    bio: "Sushi Sundays are non-negotiable. Always hunting the best omakase in KL.",
    favoriteFoods: ["Sushi", "Japanese", "Ramen", "Coffee"],
    favoriteRestaurants: ["Sushi Supreme", "Ramen Ichiban", "Kopi Corner"],
    personalityTags: ["Cafe hopper", "Fine dining lover"],
    lookingFor: "relationship",
    likesBack: true,
  },
  {
    id: "2",
    name: "Daniel",
    age: 27,
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    bio: "Street food explorer by day, Korean BBQ champion by night.",
    favoriteFoods: ["Korean BBQ", "Spicy Food", "Hotpot", "Seafood"],
    favoriteRestaurants: ["Spice Haven", "BBQ Alley", "Night Market Noodles"],
    personalityTags: ["Street food hunter", "Late night foodie", "Adventurous eater"],
    lookingFor: "food-buddy",
    likesBack: true,
  },
  {
    id: "3",
    name: "Priya",
    age: 22,
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop",
    bio: "Plant-based foodie who still appreciates a great dessert spot.",
    favoriteFoods: ["Vegan", "Dessert", "Coffee", "Pizza"],
    favoriteRestaurants: ["Green Bowl", "Sweet Crumb", "Artisan Pizza Co"],
    personalityTags: ["Healthy eater", "Dessert addict", "Cafe hopper"],
    lookingFor: "friend",
  },
  {
    id: "4",
    name: "James",
    age: 29,
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
    bio: "Burger connoisseur. If it has truffle fries, I'm already there.",
    favoriteFoods: ["Burgers", "Pizza", "Coffee", "Dessert"],
    favoriteRestaurants: ["Burger Lab", "Slice House", "Roast & Brew"],
    personalityTags: ["Late night foodie", "Adventurous eater"],
    lookingFor: "relationship",
    likesBack: true,
  },
  {
    id: "5",
    name: "Sofia",
    age: 26,
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
    bio: "Hotpot queen. The spicier, the better.",
    favoriteFoods: ["Hotpot", "Spicy Food", "Seafood", "Korean BBQ"],
    favoriteRestaurants: ["Fire Pot House", "Ocean Grill", "Seoul Kitchen"],
    personalityTags: ["Adventurous eater", "Street food hunter"],
    lookingFor: "food-buddy",
  },
  {
    id: "6",
    name: "Alex",
    age: 25,
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
    bio: "Coffee first, questions later. Brunch is a lifestyle.",
    favoriteFoods: ["Coffee", "Dessert", "Vegan", "Pizza"],
    favoriteRestaurants: ["Morning Brew", "Brunch Club", "Garden Cafe"],
    personalityTags: ["Cafe hopper", "Healthy eater", "Fine dining lover"],
    lookingFor: "friend",
  },
];

export const MOCK_SUGGESTED_RESTAURANTS: SuggestedRestaurant[] = [
  {
    id: 101,
    name: "Ramen Ichiban",
    cuisine: "Japanese",
    rating: 4.8,
    distance: "8 min",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    matchReason: "You both love ramen & Japanese food",
  },
  {
    id: 102,
    name: "Sushi Supreme",
    cuisine: "Japanese",
    rating: 4.7,
    distance: "12 min",
    image:
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
    matchReason: "Perfect for your shared sushi obsession",
  },
  {
    id: 103,
    name: "Izakaya Moon",
    cuisine: "Japanese",
    rating: 4.6,
    distance: "15 min",
    image:
      "https://images.unsplash.com/photo-1617095479584-0877e8c8e4e4?w=400&h=300&fit=crop",
    matchReason: "Cozy izakaya for cafe hoppers & sushi lovers",
  },
  {
    id: 104,
    name: "Kopi Corner",
    cuisine: "Cafe",
    rating: 4.5,
    distance: "5 min",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
    matchReason: "Great first meetup for coffee lovers",
  },
  {
    id: 105,
    name: "Fire Pot House",
    cuisine: "Hotpot",
    rating: 4.6,
    distance: "10 min",
    image:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop",
    matchReason: "Shared love of hotpot & spicy food",
  },
  {
    id: 106,
    name: "BBQ Alley",
    cuisine: "Korean",
    rating: 4.7,
    distance: "14 min",
    image:
      "https://images.unsplash.com/photo-1590301157890-3f3b0f0b0b0b?w=400&h=300&fit=crop",
    matchReason: "Korean BBQ fans unite here",
  },
];

export function computeCompatibility(
  userProfile: FoodPreferenceProfile,
  matchUser: MatchUser
): { score: number; sharedInterests: string[] } {
  const userTags = [
    ...userProfile.favoriteFoods,
    ...userProfile.personalityTags,
  ];
  const matchTags = [...matchUser.favoriteFoods, ...matchUser.personalityTags];
  const sharedInterests = userTags.filter((tag) => matchTags.includes(tag));
  const score = Math.min(100, sharedInterests.length * 10 + 20);
  return { score, sharedInterests };
}

export function getSharedInterestMessage(shared: string[]): string {
  if (shared.length === 0) return "You both love exploring new food spots!";
  const foods = shared.filter((s) =>
    FAVORITE_FOOD_OPTIONS.includes(s as (typeof FAVORITE_FOOD_OPTIONS)[number])
  );
  const tags = shared.filter((s) =>
    PERSONALITY_TAG_OPTIONS.includes(s as (typeof PERSONALITY_TAG_OPTIONS)[number])
  );
  const parts: string[] = [];
  if (foods.length >= 2) {
    parts.push(`You both love ${foods.slice(0, 2).join(" and ").toLowerCase()}`);
  } else if (foods.length === 1) {
    parts.push(`You both love ${foods[0].toLowerCase()}`);
  }
  if (tags.length > 0) {
    const tagPhrase = tags[0].toLowerCase();
    parts.push(
      parts.length ? `and ${tagPhrase}!` : `You're both ${tagPhrase}s!`
    );
  }
  return parts.join(" ") || "Great taste — you're a foodie match!";
}

export function getRestaurantsForSharedInterests(
  sharedInterests: string[]
): SuggestedRestaurant[] {
  const lower = sharedInterests.map((s) => s.toLowerCase());
  const japaneseKeywords = ["sushi", "ramen", "japanese", "coffee"];
  const koreanKeywords = ["korean bbq", "hotpot", "spicy food"];
  const cafeKeywords = ["coffee", "dessert", "cafe hopper"];

  if (japaneseKeywords.some((k) => lower.some((s) => s.includes(k)))) {
    return MOCK_SUGGESTED_RESTAURANTS.filter((r) => r.cuisine === "Japanese");
  }
  if (koreanKeywords.some((k) => lower.some((s) => s.includes(k)))) {
    return MOCK_SUGGESTED_RESTAURANTS.filter(
      (r) => r.cuisine === "Korean" || r.cuisine === "Hotpot"
    );
  }
  if (cafeKeywords.some((k) => lower.some((s) => s.includes(k)))) {
    return MOCK_SUGGESTED_RESTAURANTS.filter((r) => r.cuisine === "Cafe");
  }
  return MOCK_SUGGESTED_RESTAURANTS.slice(0, 3);
}
