import { Eye, Star, ThumbsUp, Repeat } from "lucide-react";
import {
  type SummaryMetrics,
  trendColorClass,
  formatTrendText,
} from "../../services/visibilityApi";

interface MetricsTabProps {
  summary: SummaryMetrics;
}

export function MetricsTab({ summary }: MetricsTabProps) {
  return (
    <section aria-labelledby="summary-metrics">
      <h2 id="summary-metrics" className="mb-4">
        Top Summary Metrics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visibility Score */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Eye className="text-bs-blue" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {summary.visibilityScore.value ?? 0}/
              {summary.visibilityScore.max ?? 100}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">
            Visibility Score
          </h3>
          <p
            className={`text-xs mt-1 ${trendColorClass(summary.visibilityScore.trend)}`}
          >
            {formatTrendText(
              summary.visibilityScore.trend,
              summary.visibilityScore.changeVsLastMonth ?? 0,
            )}
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-bs-gold" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {summary.averageRating.value ?? 0}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">
            Average Rating
          </h3>
          <p className="text-xs text-bs-green mt-1">
            {summary.averageRating.totalReviews ?? 0}{" "}
            {summary.averageRating.source || "Google"} Reviews
          </p>
        </div>

        {/* Social Engagement */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <ThumbsUp className="text-bs-green" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {summary.socialEngagementRate.value ?? 0}%
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">
            Engagement Rate
          </h3>
          <p
            className={`text-xs mt-1 ${trendColorClass(summary.socialEngagementRate.trend)}`}
          >
            {formatTrendText(
              summary.socialEngagementRate.trend,
              summary.socialEngagementRate.changeVsLastMonth ?? 0,
            )}
          </p>
        </div>

        {/* Repeat Visit Rate */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Repeat className="text-bs-blue" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {summary.repeatVisitRate.value ?? 0}%
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">
            Repeat Visit Rate
          </h3>
          <p
            className={`text-xs mt-1 ${trendColorClass(summary.repeatVisitRate.trend)}`}
          >
            {formatTrendText(
              summary.repeatVisitRate.trend,
              summary.repeatVisitRate.changeVsLastMonth ?? 0,
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
