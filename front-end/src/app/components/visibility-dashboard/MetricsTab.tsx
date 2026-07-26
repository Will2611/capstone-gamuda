import { Star, Navigation, Smile, Users } from "lucide-react";
import {
  type SummaryMetrics,
  type FunnelStage,
  type Sentiment,
  type FootTrafficResponse,
} from "../../services/visibilityApi";

interface MetricsTabProps {
  summary: SummaryMetrics;
  funnel: FunnelStage[];
  sentiment: Sentiment;
  footTraffic: FootTrafficResponse;
}

function directionConversionPct(funnel: FunnelStage[]): number {
  const stages = Array.isArray(funnel) ? funnel : [];
  const clicks = stages.find((s) => s.name === "Clicks");
  const directions = stages.find((s) => s.name === "Click-to-Direction");

  const clickCount = Number(clicks?.count) || 0;
  const directionCount = Number(directions?.count) || 0;

  if (clickCount <= 0) {
    // Prefer stored conversion when counts are missing but conversion exists
    const stored = Number(directions?.conversion);
    return Number.isFinite(stored) ? Math.max(0, stored) : 0;
  }

  return Math.round((directionCount / clickCount) * 1000) / 10;
}

function weeklyVisitors(footTraffic: FootTrafficResponse): number {
  const days = footTraffic?.chartDays;
  if (!Array.isArray(days) || days.length === 0) return 0;
  return days.reduce((sum, d) => sum + (Number(d?.total) || 0), 0);
}

export function MetricsTab({
  summary,
  funnel,
  sentiment,
  footTraffic,
}: MetricsTabProps) {
  const rating = Number(summary?.averageRating?.value) || 0;
  const totalReviews = Number(summary?.averageRating?.totalReviews) || 0;
  const source = summary?.averageRating?.source || "Google";

  const conversion = directionConversionPct(funnel);
  const positivePct = Number(sentiment?.positivePct);
  const safePositive = Number.isFinite(positivePct) ? positivePct : 0;
  const visitors = weeklyVisitors(footTraffic);
  const dayCount = Array.isArray(footTraffic?.chartDays)
    ? footTraffic.chartDays.length
    : 0;

  return (
    <section aria-labelledby="summary-metrics">
      <h2 id="summary-metrics" className="mb-2">
        Top Summary Metrics
      </h2>
      <p className="text-sm text-bs-neutral-600 mb-4">
        Trust, diner action, guest sentiment, and weekly footfall — at a glance.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-bs-gold" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {rating}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Average Rating</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            {totalReviews.toLocaleString()} {source} reviews
          </p>
        </div>

        {/* Direction conversion */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Navigation className="text-bs-blue" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {conversion}%
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Direction Conversion</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Interested diners who click to get directions
          </p>
        </div>

        {/* Positive sentiment */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Smile className="text-bs-green" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {safePositive}%
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Positive Sentiment</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Share of reviews that sound positive
          </p>
        </div>

        {/* Weekly visitors */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-bs-blue" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {visitors.toLocaleString()}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Weekly Visitors</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            {dayCount > 0
              ? `Total across latest ${dayCount} chart day${dayCount === 1 ? "" : "s"}`
              : "No foot traffic data yet"}
          </p>
        </div>
      </div>
    </section>
  );
}
