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
  neutralPct: number;
  complaintThemes: ComplaintThemeItem[];
}

/** Coerce unknown values to a finite number; never returns NaN. */
export function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

type Trend = "up" | "down" | "flat";

function safeTrend(value: unknown): Trend {
  return value === "up" || value === "down" || value === "flat"
    ? value
    : "flat";
}

export const EMPTY_SUMMARY: SummaryMetrics = {
  visibilityScore: {
    value: 0,
    max: 100,
    changeVsLastMonth: 0,
    trend: "flat",
  },
  averageRating: {
    value: 0,
    totalReviews: 0,
    source: "Google",
  },
  socialEngagementRate: {
    value: 0,
    changeVsLastMonth: 0,
    trend: "flat",
  },
  repeatVisitRate: {
    value: 0,
    changeVsLastMonth: 0,
    trend: "flat",
  },
};

export const EMPTY_SENTIMENT: Sentiment = {
  positivePct: 0,
  negativePct: 0,
  neutralPct: 0,
  complaintThemes: [],
};

export const EMPTY_FUNNEL_STAGES: FunnelStage[] = [
  { name: "Impressions", count: 0, conversion: 0, isDropOff: false },
  { name: "Clicks", count: 0, conversion: 0, isDropOff: false },
  { name: "Click-to-Direction", count: 0, conversion: 0, isDropOff: false },
];

export function normalizeSummary(
  raw: Partial<SummaryMetrics> | null | undefined,
): SummaryMetrics {
  const d = EMPTY_SUMMARY;
  return {
    visibilityScore: {
      value: safeNumber(raw?.visibilityScore?.value, d.visibilityScore.value),
      max: safeNumber(raw?.visibilityScore?.max, d.visibilityScore.max) || 100,
      changeVsLastMonth: safeNumber(
        raw?.visibilityScore?.changeVsLastMonth,
        d.visibilityScore.changeVsLastMonth,
      ),
      trend: safeTrend(raw?.visibilityScore?.trend),
    },
    averageRating: {
      value: safeNumber(raw?.averageRating?.value, d.averageRating.value),
      totalReviews: safeNumber(
        raw?.averageRating?.totalReviews,
        d.averageRating.totalReviews,
      ),
      source: raw?.averageRating?.source || d.averageRating.source,
    },
    socialEngagementRate: {
      value: safeNumber(
        raw?.socialEngagementRate?.value,
        d.socialEngagementRate.value,
      ),
      changeVsLastMonth: safeNumber(
        raw?.socialEngagementRate?.changeVsLastMonth,
        d.socialEngagementRate.changeVsLastMonth,
      ),
      trend: safeTrend(raw?.socialEngagementRate?.trend),
    },
    repeatVisitRate: {
      value: safeNumber(raw?.repeatVisitRate?.value, d.repeatVisitRate.value),
      changeVsLastMonth: safeNumber(
        raw?.repeatVisitRate?.changeVsLastMonth,
        d.repeatVisitRate.changeVsLastMonth,
      ),
      trend: safeTrend(raw?.repeatVisitRate?.trend),
    },
  };
}

export function normalizeFunnelStages(
  stages: FunnelStage[] | null | undefined,
): FunnelStage[] {
  if (!Array.isArray(stages) || stages.length === 0) {
    return EMPTY_FUNNEL_STAGES.map((s) => ({ ...s }));
  }
  return stages.map((s) => ({
    name: s?.name || "Unknown",
    count: safeNumber(s?.count),
    conversion: safeNumber(s?.conversion),
    isDropOff: Boolean(s?.isDropOff),
  }));
}

export function normalizeSentiment(
  raw: Partial<Sentiment> | null | undefined,
): Sentiment {
  return {
    positivePct: safeNumber(raw?.positivePct),
    negativePct: safeNumber(raw?.negativePct),
    neutralPct: safeNumber(raw?.neutralPct),
    complaintThemes: Array.isArray(raw?.complaintThemes)
      ? raw!.complaintThemes.map((c) => ({
          theme: c?.theme || "Unknown",
          count: safeNumber(c?.count),
        }))
      : [],
  };
}

export function normalizeSocialPlatforms(
  platforms: SocialPlatformCard[] | null | undefined,
): SocialPlatformCard[] {
  if (!Array.isArray(platforms)) return [];
  return platforms.map((p) => ({
    platform: p?.platform || "Unknown",
    url: p?.url || "#",
    metrics: Array.isArray(p?.metrics)
      ? p.metrics.map((m) => ({
          label: m?.label || "",
          value: m?.value == null || m.value === "" ? "0" : String(m.value),
        }))
      : [],
  }));
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface RestaurantItem {
  id: string;
  name: string;
  cuisines: string;
}

export async function fetchRestaurants(): Promise<RestaurantItem[]> {
  const response = await fetch(`${API_BASE}/visibility/restaurants`);
  if (!response.ok) throw new Error("Failed to fetch restaurants");
  return response.json();
}

export async function getSummaryMetrics(
  restaurantId: string,
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
  restaurantId: string,
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
  restaurantId: string,
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
  restaurantId: number): Promise<Sentiment> {
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
  restaurantId: string,
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
  const safeChange = Number.isFinite(change) ? change : 0;
  if (trend === "up") {
    return `↑ ${safeChange} vs. last month`;
  }
  if (trend === "down") {
    return `↓ ${Math.abs(safeChange)} vs. last month`;
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

// ──────────── Foot Traffic (hourly table only) ────────────

export interface HourlyTrafficItem {
  hour: number;
  weekdayAvg: number;
  weekendAvg: number;
}

export interface TrafficInsightItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkedDayIndex?: number | null;
  linkedSegment?: string | null;
}

export interface StaffingShiftItem {
  day: string;
  dayIndex: number;
  date: string;
  shift: string;
  segment: string;
  shiftStart: number;
  shiftEnd: number;
  expectedVisitors: number;
  staffSuggested: number;
  priority: string;
}

export interface FootTrafficResponse {
  restaurantId: string;
  hourly: HourlyTrafficItem[];
  weekdayAvg: number;
  weekendAvg: number;
  weekdayTotal: number;
  weekendTotal: number;
  insights: TrafficInsightItem[];
  nextWeekSchedule: StaffingShiftItem[];
  updatedAt?: string | null;
  live?: boolean;
}

/** Poll interval for live foot-traffic refresh (3 minutes). */
export const FOOT_TRAFFIC_POLL_MS = 3 * 60 * 1000;

export const EMPTY_FOOT_TRAFFIC: FootTrafficResponse = {
  restaurantId: "",
  hourly: [],
  weekdayAvg: 0,
  weekendAvg: 0,
  weekdayTotal: 0,
  weekendTotal: 0,
  insights: [],
  nextWeekSchedule: [],
  updatedAt: null,
  live: false,
};

export function normalizeFootTraffic(
  raw: Partial<FootTrafficResponse> | null | undefined,
  restaurantId = "",
): FootTrafficResponse {
  return {
    restaurantId:
      raw?.restaurantId != null && raw.restaurantId !== ""
        ? String(raw.restaurantId)
        : restaurantId,
    hourly: Array.isArray(raw?.hourly)
      ? raw!.hourly.map((h) => ({
          hour: safeNumber(h?.hour),
          weekdayAvg: safeNumber(h?.weekdayAvg),
          weekendAvg: safeNumber(h?.weekendAvg),
        }))
      : [],
    weekdayAvg: safeNumber(raw?.weekdayAvg),
    weekendAvg: safeNumber(raw?.weekendAvg),
    weekdayTotal: safeNumber(raw?.weekdayTotal),
    weekendTotal: safeNumber(raw?.weekendTotal),
    insights: Array.isArray(raw?.insights)
      ? raw!.insights.map((item) => ({
          id: item?.id ?? "",
          type: item?.type ?? "tip",
          title: item?.title ?? "",
          body: item?.body ?? "",
          linkedDayIndex:
            item?.linkedDayIndex == null
              ? null
              : safeNumber(item.linkedDayIndex),
          linkedSegment: item?.linkedSegment ?? null,
        }))
      : [],
    nextWeekSchedule: Array.isArray(raw?.nextWeekSchedule)
      ? raw!.nextWeekSchedule.map((s) => ({
          day: s?.day ?? "",
          dayIndex: safeNumber(s?.dayIndex),
          date: s?.date ?? "",
          shift: s?.shift ?? "",
          segment: s?.segment ?? "",
          shiftStart: safeNumber(s?.shiftStart),
          shiftEnd: safeNumber(s?.shiftEnd),
          expectedVisitors: safeNumber(s?.expectedVisitors),
          staffSuggested: safeNumber(s?.staffSuggested),
          priority: s?.priority ?? "low",
        }))
      : [],
    updatedAt: raw?.updatedAt ?? null,
    live: Boolean(raw?.live),
  };
}

export async function getFootTraffic(
  restaurantId: string,
  options: { live?: boolean } = {},
): Promise<FootTrafficResponse> {
  const live = options.live ?? false;
  const params = new URLSearchParams({
    restaurantId,
    live: String(live),
  });
  const response = await fetch(
    `${API_BASE}/visibility/getFootTraffic?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch foot traffic data");
  }

  return response.json();
}

// ──────────── Action Suggestions ────────────

export interface ActionSuggestion {
  issue: string;
  impact: string;
  recommendation: string;
}

export interface ActionSuggestionsResponse {
  restaurantId: string;
  suggestions: ActionSuggestion[];
}

export async function getActionSuggestions(
  restaurantId: string,
): Promise<ActionSuggestionsResponse> {
  const response = await fetch(
    `${API_BASE}/visibility/getActionSuggestions?restaurantId=${restaurantId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch suggestions");
  }

  return response.json();
}
