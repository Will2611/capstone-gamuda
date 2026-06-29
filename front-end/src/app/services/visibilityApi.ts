/**
 * Visibility Dashboard API Service
 *
 * Backend endpoints:
 * - GET /getSummaryMetrics?restaurantId={id}
 * - GET /getFunnelMetrics?restaurantId={id}
 * - GET /getSocialVisibility?restaurantId={id}
 * - GET /getSentiment?restaurantId={id}
 */

export interface SummaryMetrics {
  visibilityScore: {
    value: number;
    max: number;
    changeVsLastMonth: number;
    trend: "up" | "down" | "flat";
  };
  averageRating: {
    value: number;
    totalReviews: number;
    source: string;
  };
  socialEngagementRate: {
    value: number;
    changeVsLastMonth: number;
    trend: "up" | "down" | "flat";
  };
  repeatVisitRate: {
    value: number;
    changeVsLastMonth: number;
    trend: "up" | "down" | "flat";
  };
}

export interface FunnelStage {
  name: string;
  count: number;
  conversion: number;
  isDropOff: boolean;
}

export interface FunnelMetrics {
  stages: FunnelStage[];
}

export interface PlatformMetric {
  label: string;
  value: string;
}

export interface SocialPlatformCard {
  platform: string;
  metrics: PlatformMetric[];
  url: string;
}

export interface SocialVisibility {
  platforms: SocialPlatformCard[];
}

export interface ComplaintThemeItem {
  theme: string;
  count: number;
}

export interface Sentiment {
  positivePct: number;
  negativePct: number;
  brandAwarenessPct: number;
  brandAwarenessChange: number;
  localSearchRank: number;
  searchRankChange: number;
  keywordMatchRate: number;
  postsPerWeekAvg: number;
  complaintThemes: ComplaintThemeItem[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface RestaurantItem {
  id: number;
  name: string;
  cuisines: string;
}

export async function fetchRestaurants(): Promise<RestaurantItem[]> {
  const response = await fetch(`${API_BASE}/visibility/restaurants`);
  if (!response.ok) throw new Error("Failed to fetch restaurants");
  return response.json();
}

export async function getSummaryMetrics(
  restaurantId: number,
): Promise<SummaryMetrics> {
  const response = await fetch(
    `${API_BASE}/visibility/getSummaryMetrics?restaurantId=${restaurantId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch summary metrics");
  }

  return response.json();
}

export async function getFunnelMetrics(
  restaurantId: number,
): Promise<FunnelMetrics> {
  const response = await fetch(
    `${API_BASE}/visibility/getFunnelMetrics?restaurantId=${restaurantId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch funnel metrics");
  }

  return response.json();
}

export async function getSocialVisibility(
  restaurantId: number,
): Promise<SocialVisibility> {
  const response = await fetch(
    `${API_BASE}/visibility/getSocialVisibility?restaurantId=${restaurantId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch social visibility");
  }

  return response.json();
}

export async function getSentiment(
  restaurantId: number,
): Promise<Sentiment> {
  const response = await fetch(
    `${API_BASE}/visibility/getSentiment?restaurantId=${restaurantId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sentiment data");
  }

  return response.json();
}

export interface ReviewItem {
  stars: number;
  text: string;
  matched: boolean;
}

export interface ReviewsByTheme {
  theme: string;
  totalNegative: number;
  matchedCount: number;
  reviews: ReviewItem[];
}

export async function getReviewsByTheme(
  restaurantId: number,
  theme: string,
): Promise<ReviewsByTheme> {
  const response = await fetch(
    `${API_BASE}/visibility/getReviewsByTheme?restaurantId=${restaurantId}&theme=${encodeURIComponent(theme)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }

  return response.json();
}

export function formatTrendText(
  trend: "up" | "down" | "flat",
  change: number,
): string {
  if (trend === "up") {
    return `↑ ${change} vs. last month`;
  }
  if (trend === "down") {
    return `↓ ${Math.abs(change)} vs. last month`;
  }
  return "No change vs. last month";
}

export function trendColorClass(trend: "up" | "down" | "flat"): string {
  if (trend === "down") {
    return "text-bs-red";
  }
  if (trend === "up") {
    return "text-bs-green";
  }
  return "text-bs-neutral-600";
}
