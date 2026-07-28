/**
 * Shared segment definitions — must match back-end traffic_analytics.py
 */
import type { ChartDayTrafficItem } from "../services/visibilityApi";

export const TRAFFIC_SEGMENT_HOURS = {
  morning: [8, 9, 10, 11],
  lunch: [12, 13, 14],
  afternoon: [15, 16, 17],
  dinner: [18, 19, 20],
  lateNight: [21, 22, 23],
} as const;

export type TrafficSegmentKey = keyof typeof TRAFFIC_SEGMENT_HOURS;

export interface TrafficInsightItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkedDayIndex?: number | null;
  linkedSegment?: TrafficSegmentKey | string | null;
}

export interface StackedDayRow {
  dayIndex: number;
  day: string;
  label: string;
  trafficDate: string;
  morning: number;
  lunch: number;
  afternoon: number;
  dinner: number;
  lateNight: number;
  total: number;
}

function formatChartLabel(trafficDate: string, dayName: string): string {
  if (!trafficDate) return dayName.slice(0, 3);
  const parsed = new Date(`${trafficDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dayName.slice(0, 3);
  const month = parsed.toLocaleString("en", { month: "short" });
  return `${dayName.slice(0, 3)} ${parsed.getDate()} ${month}`;
}

export function buildStackedChartData(
  chartDays: ChartDayTrafficItem[],
): StackedDayRow[] {
  return chartDays.map((day) => ({
    dayIndex: day.dayIndex,
    day: day.dayName,
    trafficDate: day.trafficDate,
    label: formatChartLabel(day.trafficDate, day.dayName),
    morning: day.morning ?? 0,
    lunch: day.lunch ?? 0,
    afternoon: day.afternoon ?? 0,
    dinner: day.dinner ?? 0,
    lateNight: day.lateNight ?? 0,
    total: day.total ?? 0,
  }));
}

export function formatChartWeekRange(chartDays: ChartDayTrafficItem[]): string {
  if (!chartDays.length) return "Hourly Foot Traffic";
  const year = (chartDays[0].trafficDate ?? "").slice(0, 4) || "—";
  return `Hourly Foot Traffic (${year})`;
}

export const TRAFFIC_SEGMENTS = [
  { key: "morning" as const, label: "Morning (8–11 AM)", color: "#93C5FD" },
  { key: "lunch" as const, label: "Lunch (12–3 PM)", color: "#22C55E" },
  {
    key: "afternoon" as const,
    label: "Afternoon (3–5 PM)",
    color: "#86EFAC",
  },
  { key: "dinner" as const, label: "Dinner (6–9 PM)", color: "#F97316" },
  {
    key: "lateNight" as const,
    label: "Late Night (9–11 PM)",
    color: "#374151",
  },
];

export function insightCardStyle(type: string) {
  switch (type) {
    case "weekday":
      return {
        border: "border-blue-200",
        background: "#EFF6FF",
        title: "text-blue-700",
      };
    case "weekend":
      return {
        border: "border-orange-200",
        background: "#FFF7ED",
        title: "text-orange-700",
      };
    case "peak":
      return {
        border: "border-green-200",
        background: "#F0FDF4",
        title: "text-green-700",
      };
    default:
      return {
        border: "border-bs-neutral-200",
        background: "#F5F5F5",
        title: "text-bs-neutral-600",
      };
  }
}
