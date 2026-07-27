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
  positiveThemes: ComplaintThemeItem[];
}

export interface DemographicGroupResponse {
  label: string;
  count: number;
}

export interface DemographicsResponse {
  restaurantId: string;
  totalVisitors: number;
  ageGroups: DemographicGroupResponse[];
  genderBreakdown: DemographicGroupResponse[];
}

export interface AgeGroup {
  ageRange: string;
  count: number;
  color: string;
}

export interface GenderGroup {
  gender: string;
  count: number;
  color: string;
}

export interface CustomerDemographics {
  totalVisitors: number;
  ageGroups: AgeGroup[];
  genderBreakdown: GenderGroup[];
}

export const EMPTY_DEMOGRAPHICS: CustomerDemographics = {
  totalVisitors: 0,
  ageGroups: [
    { ageRange: "18-24", count: 0, color: "#60A5FA" },
    { ageRange: "25-34", count: 0, color: "#FBBF24" },
    { ageRange: "35-44", count: 0, color: "#34D399" },
    { ageRange: "45-54", count: 0, color: "#F472B6" },
    { ageRange: "55+", count: 0, color: "#A78BFA" },
  ],
  genderBreakdown: [
    { gender: "Female", count: 0, color: "#3B82F6" },
    { gender: "Male", count: 0, color: "#F97316" },
    { gender: "Prefer not to say", count: 0, color: "#8B5CF6" },
  ],
};

function createSeededValue(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
}

function distributeByWeights(
  total: number,
  weights: number[],
  seed: string,
): number[] {
  if (total <= 0) return weights.map(() => 0);

  const adjustedWeights = weights.map((weight, index) => {
    const jitter = 1 + (createSeededValue(`${seed}-${index}`) - 0.5) * 0.08;
    return Math.max(weight * jitter, 0.01);
  });

  const sum = adjustedWeights.reduce((acc, value) => acc + value, 0);
  const baseCounts = adjustedWeights.map((weight) =>
    Math.floor((total * weight) / sum),
  );

  let remainder = total - baseCounts.reduce((acc, value) => acc + value, 0);
  const order = [...baseCounts.keys()].sort(
    (left, right) =>
      (total * adjustedWeights[right]) / sum -
      baseCounts[right] -
      ((total * adjustedWeights[left]) / sum - baseCounts[left]),
  );

  for (let index = 0; index < remainder; index += 1) {
    baseCounts[order[index]] += 1;
  }

  return baseCounts;
}

export function buildMonthlyDemographicsFromTraffic(
  footTraffic: Partial<FootTrafficResponse> | null | undefined,
  fallback: CustomerDemographics | null | undefined = null,
): CustomerDemographics {
  const chartTotal = Array.isArray(footTraffic?.chartDays)
    ? footTraffic.chartDays.reduce(
        (sum, day) => sum + safeNumber(day?.total),
        0,
      )
    : 0;

  const totalVisitors = Math.max(
    chartTotal,
    safeNumber(footTraffic?.weekdayTotal) +
      safeNumber(footTraffic?.weekendTotal),
  );

  if (totalVisitors <= 0) {
    return fallback ?? EMPTY_DEMOGRAPHICS;
  }

  const monthKey = new Date().toISOString().slice(0, 7);
  const seed = `${footTraffic?.restaurantId ?? "default"}-${monthKey}`;

  const ageWeights = [0.24, 0.3, 0.2, 0.14, 0.12];
  const genderWeights = [0.48, 0.44, 0.08];

  const ageCounts = distributeByWeights(totalVisitors, ageWeights, seed);
  const genderCounts = distributeByWeights(
    totalVisitors,
    genderWeights,
    `${seed}-gender`,
  );

  const ageLabels = ["18-24", "25-34", "35-44", "45-54", "55+"];
  const genderLabels = ["Female", "Male", "Prefer not to say"];
  const ageColors = ["#60A5FA", "#FBBF24", "#34D399", "#F472B6", "#A78BFA"];
  const genderColors = ["#3B82F6", "#F97316", "#8B5CF6"];

  return {
    totalVisitors,
    ageGroups: ageLabels.map((label, index) => ({
      ageRange: label,
      count: ageCounts[index],
      color: ageColors[index],
    })),
    genderBreakdown: genderLabels.map((label, index) => ({
      gender: label,
      count: genderCounts[index],
      color: genderColors[index],
    })),
  };
}

/*
 * Visibility Dashboard API Service
 *
 * Backend endpoints:
 * - GET /visibility/getSummaryMetrics?restaurantId={id}
 * - GET /visibility/getFunnelMetrics?restaurantId={id}
 * - GET /visibility/getSocialVisibility?restaurantId={id}
 * - GET /visibility/getSentiment?restaurantId={id}
 * - GET /visibility/getFootTraffic?restaurantId={id}
 * - GET /visibility/getDemographics?restaurantId={id}
 */

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
  positiveThemes: [],
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

function normalizeThemeList(
  themes: ComplaintThemeItem[] | null | undefined,
): ComplaintThemeItem[] {
  if (!Array.isArray(themes)) return [];
  return themes.map((c) => ({
    theme: c?.theme || "Unknown",
    count: safeNumber(c?.count),
  }));
}

export function normalizeSentiment(
  raw: Partial<Sentiment> | null | undefined,
): Sentiment {
  return {
    positivePct: safeNumber(raw?.positivePct),
    negativePct: safeNumber(raw?.negativePct),
    neutralPct: safeNumber(raw?.neutralPct),
    complaintThemes: normalizeThemeList(raw?.complaintThemes),
    positiveThemes: normalizeThemeList(raw?.positiveThemes),
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

export function normalizeDemographics(
  raw: Partial<DemographicsResponse> | null | undefined,
): CustomerDemographics {
  const ageColors = ["#60A5FA", "#FBBF24", "#34D399", "#F472B6", "#A78BFA"];
  const genderColors = ["#3B82F6", "#F97316", "#8B5CF6"];

  const ageLabels = ["18-24", "25-34", "35-44", "45-54", "55+"];
  const genderLabels = ["Female", "Male", "Prefer not to say"];

  const ageGroups: AgeGroup[] = ageLabels.map((label, index) => {
    const source = raw?.ageGroups?.find((group) => group?.label === label);
    return {
      ageRange: label,
      count: safeNumber(source?.count),
      color: ageColors[index],
    };
  });

  const genderBreakdown: GenderGroup[] = genderLabels.map((label, index) => {
    const source = raw?.genderBreakdown?.find(
      (group) => group?.label === label,
    );
    return {
      gender: label,
      count: safeNumber(source?.count),
      color: genderColors[index],
    };
  });

  return {
    totalVisitors: safeNumber(raw?.totalVisitors),
    ageGroups,
    genderBreakdown,
  };
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

export async function getSentiment(restaurantId: string): Promise<Sentiment> {
  const response = await fetch(
    `${API_BASE}/visibility/getSentiment?restaurantId=${restaurantId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sentiment data");
  }

  return response.json();
}

export async function getDemographics(
  restaurantId: string,
): Promise<DemographicsResponse> {
  const response = await fetch(
    `${API_BASE}/visibility/getDemographics?restaurantId=${restaurantId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch demographics data");
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

export type ThemeSentimentType = "Positive" | "Negative" | "Neutral";

export async function getReviewsByTheme(
  restaurantId: string,
  theme: string,
  sentimentType: ThemeSentimentType = "Negative",
): Promise<ReviewsByTheme> {
  const params = new URLSearchParams({
    restaurantId,
    theme,
    sentimentType,
  });
  const response = await fetch(
    `${API_BASE}/visibility/getReviewsByTheme?${params.toString()}`,
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

// ──────────── Foot Traffic (per traffic_date hourly counts) ────────────

export interface ChartDayTrafficItem {
  trafficDate: string;
  dayName: string;
  dayType: string;
  dayIndex: number;
  morning: number;
  lunch: number;
  afternoon: number;
  dinner: number;
  lateNight: number;
  total: number;
}

export interface TrafficInsightItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkedDayIndex?: number | null;
  linkedSegment?: string | null;
}

export interface FootTrafficResponse {
  restaurantId: string;
  chartDays: ChartDayTrafficItem[];
  weekdayTotal: number;
  weekendTotal: number;
  insights: TrafficInsightItem[];
  updatedAt?: string | null;
}

export const EMPTY_FOOT_TRAFFIC: FootTrafficResponse = {
  restaurantId: "",
  chartDays: [],
  weekdayTotal: 0,
  weekendTotal: 0,
  insights: [],
  updatedAt: null,
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
    chartDays: Array.isArray(raw?.chartDays)
      ? raw!.chartDays.map((d) => ({
          trafficDate: d?.trafficDate ?? "",
          dayName: d?.dayName ?? "",
          dayType: d?.dayType ?? "",
          dayIndex: safeNumber(d?.dayIndex),
          morning: safeNumber(d?.morning),
          lunch: safeNumber(d?.lunch),
          afternoon: safeNumber(d?.afternoon),
          dinner: safeNumber(d?.dinner),
          lateNight: safeNumber(d?.lateNight),
          total: safeNumber(d?.total),
        }))
      : [],
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
    updatedAt: raw?.updatedAt ?? null,
  };
}

export async function getFootTraffic(
  restaurantId: string,
): Promise<FootTrafficResponse> {
  const params = new URLSearchParams({ restaurantId });
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
