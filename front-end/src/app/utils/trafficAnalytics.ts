/**
 * Shared segment definitions — must match back-end traffic_analytics.py
 */
export const TRAFFIC_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const TRAFFIC_SEGMENT_HOURS = {
  morning: [8, 9, 10, 11],
  lunch: [12, 13, 14],
  afternoon: [15, 16, 17],
  dinner: [18, 19, 20],
  lateNight: [21, 22, 23],
} as const;

export type TrafficSegmentKey = keyof typeof TRAFFIC_SEGMENT_HOURS;

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
  linkedSegment?: TrafficSegmentKey | string | null;
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
  priority: "high" | "medium" | "low" | string;
}

export interface StackedDayRow {
  dayIndex: number;
  day: string;
  label: string;
  morning: number;
  lunch: number;
  afternoon: number;
  dinner: number;
  lateNight: number;
  total: number;
}

export function buildStackedChartData(
  hourly: HourlyTrafficItem[],
): StackedDayRow[] {
  const hasHourlyData = hourly.some(
    (h) => (h.weekdayAvg ?? 0) > 0 || (h.weekendAvg ?? 0) > 0,
  );

  const getHourAvg = (hour: number, isWeekend: boolean) => {
    const row = hourly.find((x) => x.hour === hour);
    if (!row) return 0;
    const value = isWeekend ? row.weekendAvg : row.weekdayAvg;
    return Math.max(0, Math.round(value ?? 0));
  };

  const sumHours = (hours: readonly number[], isWeekend: boolean) =>
    hours.reduce((sum, hour) => sum + getHourAvg(hour, isWeekend), 0);

  return TRAFFIC_DAYS.map((day, i) => {
    const isWeekend = i >= 5;
    const morning = hasHourlyData
      ? sumHours(TRAFFIC_SEGMENT_HOURS.morning, isWeekend)
      : 0;
    const lunch = hasHourlyData
      ? sumHours(TRAFFIC_SEGMENT_HOURS.lunch, isWeekend)
      : 0;
    const afternoon = hasHourlyData
      ? sumHours(TRAFFIC_SEGMENT_HOURS.afternoon, isWeekend)
      : 0;
    const dinner = hasHourlyData
      ? sumHours(TRAFFIC_SEGMENT_HOURS.dinner, isWeekend)
      : 0;
    const lateNight = hasHourlyData
      ? sumHours(TRAFFIC_SEGMENT_HOURS.lateNight, isWeekend)
      : 0;
    return {
      dayIndex: i,
      day,
      label: `${day.slice(0, 3)} Jun ${i + 1}`,
      morning,
      lunch,
      afternoon,
      dinner,
      lateNight,
      total: morning + lunch + afternoon + dinner + lateNight,
    };
  });
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

export function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "high":
      return "bg-bs-red/10 text-bs-red";
    case "medium":
      return "bg-bs-gold/10 text-bs-gold";
    default:
      return "bg-bs-neutral-100 text-bs-neutral-600";
  }
}
