// src/config/filterOptions.ts

export const CUISINE_OPTIONS = [
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "western", label: "Western" },
  { value: "chinese", label: "Chinese" },
  { value: "malay", label: "Malay" },
  { value: "indian", label: "Indian" },
  { value: "fusion", label: "Fusion" },
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "asian", label: "Asian" },
  { value: "american", label: "American" },
  { value: "mediterranean", label: "Mediterranean" },
];

export const PRICE_OPTIONS = [
  { value: "1", label: "$ < RM20" },
  { value: "2", label: "$$ RM20 - RM60" },
  { value: "3", label: "$$$ RM60 - RM110" },
  { value: "4", label: "$$$$ RM110 - RM250" },
  { value: "5", label: "$$$$$ > RM250" },
];

export const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
];

export const DISTANCE_OPTIONS = [
  { value: "1", label: "< 1 mile" },
  { value: "3", label: "< 3 miles" },
  { value: "5", label: "< 5 miles" },
  { value: "10", label: "< 10 miles" },
  { value: "20", label: "< 20 miles" },
];

export const AMBIENCE_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "finedining", label: "Fine Dining" },
  { value: "romantic", label: "Romantic" },
  { value: "family", label: "Family" },
  { value: "business", label: "Business" },
  { value: "trendy", label: "Trendy" },
  { value: "quiet", label: "Quiet" },
  { value: "cozy", label: "Cozy" },
  { value: "lively", label: "Lively" },
];

export const TIME_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "late-night", label: "Late Night" },
];

export const DAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export const RELIGION_OPTIONS = [
  { value: "Islam", label: "Islam" },
  { value: "Christianity", label: "Christianity" },
  { value: "Buddhism", label: "Buddhism" },
  { value: "Hinduism", label: "Hinduism" },
  { value: "Others", label: "Others" },
];

export const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ms", label: "Bahasa Melayu" },
];

export const PERSONALITY_TAG_OPTIONS = [
  "Adventurous eater",
  "Cafe hopper",
  "Fine dining lover",
  "Street food hunter",
  "Late night foodie",
  "Healthy eater",
  "Dessert addict",
];

/**
 * Helper utility to construct dropdown lists with dynamic default labels
 * (e.g., "Select Cuisine" for forms vs "Cuisine" for short filter bars)
 */
export const getDropdownOptions = (
  defaultLabel: string,
  options: { value: string; label: string }[],
) => [{ value: "", label: defaultLabel }, ...options];
