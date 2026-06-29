import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Star,
  ThumbsUp,
  Repeat,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Search,
  Calendar,
  ExternalLink,
  Lightbulb,
  Megaphone,
  Loader2,
} from "lucide-react";
import Instagram from "@/assets/instagram.svg?react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { SocialMediaCard } from "../components/visibility-dashboard/SocialMediaCard";
import { ActionModal } from "../components/visibility-dashboard/ActionModal";
import { FunnelChart } from "../components/visibility-dashboard/FunnelChart";
import { useNavigate } from "react-router";
import {
  fetchRestaurants,
  getSummaryMetrics,
  getFunnelMetrics,
  getSocialVisibility,
  getSentiment,
  getReviewsByTheme,
  formatTrendText,
  trendColorClass,
  type SummaryMetrics,
  type FunnelStage,
  type SocialPlatformCard,
  type Sentiment,
  type RestaurantItem,
  type ReviewsByTheme,
} from "../services/visibilityApi";

export default function SocialVisibilityDashboard() {
  const navigate = useNavigate();

  const [selectedModal, setSelectedModal] = useState<string | null>(null);

  // ── Data state ──
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [social, setSocial] = useState<SocialPlatformCard[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Theme reviews popup ──
  const [themeReviewsData, setThemeReviewsData] =
    useState<ReviewsByTheme | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [loadingReviews, setLoadingReviews] = useState(false);

  const handleThemeClick = async (theme: string) => {
    if (!selectedRestaurantId) return;
    setSelectedTheme(theme);
    setLoadingReviews(true);
    try {
      const data = await getReviewsByTheme(selectedRestaurantId, theme);
      setThemeReviewsData(data);
    } catch {
      setThemeReviewsData(null);
    } finally {
      setLoadingReviews(false);
    }
  };

  // ── Load restaurant list on mount ──
  useEffect(() => {
    fetchRestaurants()
      .then((data) => {
        setRestaurants(data);
        if (data.length > 0) {
          setSelectedRestaurantId(data[0].id);
        }
      })
      .catch(() =>
        setError("Failed to load restaurants. Is the backend running?"),
      );
  }, []);

  // ── Fetch all dashboard data when restaurant changes ──
  const loadDashboard = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, funnelRes, socialRes, sentimentRes] =
        await Promise.all([
          getSummaryMetrics(id),
          getFunnelMetrics(id),
          getSocialVisibility(id),
          getSentiment(id),
        ]);
      setSummary(summaryRes);
      setFunnel(funnelRes.stages);
      setSocial(socialRes.platforms);
      setSentiment(sentimentRes);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRestaurantId !== null) {
      loadDashboard(selectedRestaurantId);
    }
  }, [selectedRestaurantId, loadDashboard]);

  // ── Derived chart data ──
  const sentimentPieData = sentiment
    ? [
        { name: "Positive", value: sentiment.positivePct, color: "#27AE60" },
        { name: "Negative", value: sentiment.negativePct, color: "#FF4C4C" },
      ]
    : [];

  const complaintThemeData = sentiment
    ? sentiment.complaintThemes.map((c) => ({ theme: c.theme, count: c.count }))
    : [];

  // Freshness: simulated per-week posts from postsPerWeekAvg
  const freshnessData = sentiment
    ? Array.from({ length: 4 }, (_, i) => ({
        week: `W${i + 1}`,
        posts: Math.max(
          0,
          Math.round(sentiment.postsPerWeekAvg + (Math.random() - 0.5) * 2),
        ),
        reviews: Math.round(
          sentiment.postsPerWeekAvg * (Math.random() + 0.5) * 2,
        ),
      }))
    : [];

  // ── Helper: find drop-off stage ──
  const dropOffStage = funnel.find((s) => s.isDropOff);

  const handleQuickFix = (action: string) => {
    setSelectedModal(action);
  };

  const modals = {
    "reply-reviews": {
      title: "Reply to Reviews",
      content:
        "Respond to your recent negative reviews to improve customer sentiment and show you care.",
      suggestedText:
        "Thank you for your feedback! We apologize for the wait time and are working to improve our service. We'd love another chance to serve you better.",
      suggestedHashtags: [],
    },
    "post-instagram": {
      title: "Post on Instagram",
      content:
        "Share engaging content to boost your social media presence and reach.",
      suggestedText:
        "Join us for our famous Spicy Noodle Challenge! 🌶️ Tag us in your food adventures!",
      suggestedHashtags: [
        "#SpicyNoodles",
        "#FoodieChallenge",
        "#LocalEats",
        "#ThaiFood",
      ],
    },
    "update-keywords": {
      title: "Update Keywords",
      content:
        "Add trending keywords to your menu description to improve search visibility.",
      suggestedText:
        "Our signature Spicy Noodles are a local favorite! Try our authentic Thai cuisine with bold flavors.",
      suggestedHashtags: ["#SpicyNoodles", "#ThaiFood", "#LocalEats"],
    },
  };

  // ── Loading / Error / Empty states ──
  if (!selectedRestaurantId && restaurants.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-bs-neutral-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-bs-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bs-neutral-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-bs-neutral-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="mb-2">Social Visibility & Insights Dashboard</h1>
              <p className="text-bs-neutral-600">
                Understand your traffic, visibility, and brand awareness with
                actionable insights
              </p>
            </div>
            {restaurants.length > 0 && (
              <select
                className="border-2 border-bs-neutral-200 rounded-lg px-4 py-2 text-sm bg-white max-w-xs"
                value={selectedRestaurantId ?? ""}
                onChange={(e) =>
                  setSelectedRestaurantId(Number(e.target.value))
                }
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} &middot; {r.cuisines}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-bs-red/10 border border-bs-red/20 text-bs-red rounded-lg p-4 text-sm">
            {error}
          </div>
        </div>
      )}

      {loading && !summary && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-bs-blue" size={40} />
        </div>
      )}

      {!loading && summary && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* 1. Top Summary Metrics */}
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
                    {summary.visibilityScore.value}/
                    {summary.visibilityScore.max}
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
                    summary.visibilityScore.changeVsLastMonth,
                  )}
                </p>
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Star className="text-bs-gold" size={24} />
                  <span className="text-2xl font-bold text-bs-neutral-900">
                    {summary.averageRating.value}
                  </span>
                </div>
                <h3 className="text-sm text-bs-neutral-600">Average Rating</h3>
                <p className="text-xs text-bs-green mt-1">
                  {summary.averageRating.totalReviews}{" "}
                  {summary.averageRating.source} Reviews
                </p>
              </div>

              {/* Social Engagement */}
              <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <ThumbsUp className="text-bs-green" size={24} />
                  <span className="text-2xl font-bold text-bs-neutral-900">
                    {summary.socialEngagementRate.value}%
                  </span>
                </div>
                <h3 className="text-sm text-bs-neutral-600">
                  Social Engagement Rate
                </h3>
                <p
                  className={`text-xs mt-1 ${trendColorClass(summary.socialEngagementRate.trend)}`}
                >
                  {formatTrendText(
                    summary.socialEngagementRate.trend,
                    summary.socialEngagementRate.changeVsLastMonth,
                  )}
                </p>
              </div>

              {/* Repeat Visit Rate */}
              <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Repeat className="text-bs-blue" size={24} />
                  <span className="text-2xl font-bold text-bs-neutral-900">
                    {summary.repeatVisitRate.value}%
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
                    summary.repeatVisitRate.changeVsLastMonth,
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* 2. Traffic & Conversion Funnel */}
          <section aria-labelledby="traffic-funnel">
            <h2 id="traffic-funnel" className="mb-4">
              Traffic & Conversion Funnel
            </h2>
            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 mt-4">
              <h3 className="mb-4">Conversion Funnel</h3>
              <FunnelChart stages={funnel} />

              {dropOffStage && (
                <div className="mt-4 p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-bs-neutral-900">
                    <AlertCircle size={16} className="text-bs-red" />
                    <span className="font-medium">Drop-off detected:</span>
                    <span>
                      {dropOffStage.name} conversion is{" "}
                      {dropOffStage.conversion}% below average
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. Social Media Visibility */}
          <section aria-labelledby="social-visibility">
            <h2 id="social-visibility" className="mb-4">
              Social Media Visibility
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {social.map((p) => (
                <SocialMediaCard
                  key={p.platform}
                  platform={p.platform}
                  icon={
                    p.platform === "Google Reviews" ? (
                      <Star size={24} />
                    ) : p.platform === "Instagram" ? (
                      <Instagram width={24} />
                    ) : (
                      <MessageSquare size={24} />
                    )
                  }
                  metrics={p.metrics}
                  ctaLabel={`Open ${p.platform}`}
                  url={p.url}
                  color={
                    p.platform === "Google Reviews"
                      ? "text-bs-gold"
                      : p.platform === "Instagram"
                        ? "text-bs-red"
                        : "text-bs-blue"
                  }
                />
              ))}
            </div>
          </section>

          {/* 4. Customer Sentiment & Awareness */}
          {sentiment && (
            <section aria-labelledby="sentiment-awareness">
              <h2 id="sentiment-awareness" className="mb-4">
                Customer Sentiment & Awareness
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Sentiment Widget */}
                <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                  <h3 className="mb-4">Review Sentiment</h3>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          key="sentiment"
                          data={sentimentPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {sentimentPieData.map((entry, index) => (
                            <Cell
                              key={`sentiment-cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-bs-green">
                        {sentiment.positivePct}%
                      </div>
                      <div className="text-sm text-bs-neutral-600">
                        Positive
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-bs-red">
                        {sentiment.negativePct}%
                      </div>
                      <div className="text-sm text-bs-neutral-600">
                        Negative
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Complaint Themes */}
                <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                  <h3 className="mb-4">Top Complaint Themes</h3>
                  <p className="text-xs text-bs-neutral-500 -mt-2 mb-2">
                    Click a bar to see related Google Reviews
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={complaintThemeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis dataKey="theme" stroke="#737373" />
                      <YAxis stroke="#737373" />
                      <Tooltip />
                      <Bar
                        key="count"
                        dataKey="count"
                        fill="#FF4C4C"
                        radius={[8, 8, 0, 0]}
                        cursor="pointer"
                        onClick={(event) => {
                          // event can be a BarRectangleItem or an object with payload
                          const ev: any = event;
                          const theme = ev.payload?.theme ?? ev.theme;
                          if (theme) handleThemeClick(theme);
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  {complaintThemeData.length > 0 && (
                    <div className="mt-4 text-sm text-bs-neutral-600">
                      Most common issue:{" "}
                      <span className="font-bold text-bs-red">
                        {
                          complaintThemeData.sort(
                            (a, b) => b.count - a.count,
                          )[0].theme
                        }{" "}
                        (
                        {
                          complaintThemeData.sort(
                            (a, b) => b.count - a.count,
                          )[0].count
                        }{" "}
                        mentions)
                      </span>
                    </div>
                  )}
                </div>

                {/* Brand Awareness */}
                <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 lg:col-span-2">
                  <h3 className="mb-4">Brand Awareness</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-bs-neutral-900">
                        {sentiment.brandAwarenessPct}%
                      </div>
                      <div className="text-sm text-bs-neutral-600 mt-1">
                        of local customers recognize your brand
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-sm font-medium"
                        style={{
                          color:
                            sentiment.brandAwarenessChange >= 0
                              ? "#27AE60"
                              : "#FF4C4C",
                        }}
                      >
                        {sentiment.brandAwarenessChange >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(sentiment.brandAwarenessChange)}% vs. last
                        quarter
                      </div>
                      <div className="text-xs text-bs-neutral-500 mt-1">
                        Target: 75% by Q3
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 5. SEO & Long-Term Growth */}
          {sentiment && (
            <section aria-labelledby="seo-growth">
              <h2 id="seo-growth" className="mb-4">
                SEO & Long-Term Growth
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Local Search Rank */}
                <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="text-bs-blue" size={24} />
                    <h3 className="font-bold text-bs-neutral-900">
                      Local Search Rank
                    </h3>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-bs-neutral-900">
                      #{sentiment.localSearchRank}
                    </div>
                    <div className="text-sm text-bs-neutral-600 mt-2">
                      for "best Thai food near me"
                    </div>
                    <div
                      className={`text-xs mt-1 ${trendColorClass(sentiment.searchRankChange > 0 ? "up" : sentiment.searchRankChange < 0 ? "down" : "flat")}`}
                    >
                      {sentiment.searchRankChange >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(sentiment.searchRankChange)} positions vs. last
                      week
                    </div>
                  </div>
                </div>

                {/* Keyword Match Rate */}
                <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="text-bs-green" size={24} />
                    <h3 className="font-bold text-bs-neutral-900">
                      Keyword Match Rate
                    </h3>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-bs-neutral-900">
                      {sentiment.keywordMatchRate}%
                    </div>
                    <div className="text-sm text-bs-neutral-600 mt-2">
                      menu aligned with trending searches
                    </div>
                    <div className="text-xs text-bs-gold mt-1">Target: 80%</div>
                  </div>
                </div>

                {/* Content Freshness */}
                <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="text-bs-gold" size={24} />
                    <h3 className="font-bold text-bs-neutral-900">
                      Content Freshness
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={freshnessData}>
                      <XAxis
                        dataKey="week"
                        stroke="#737373"
                        style={{ fontSize: "10px" }}
                      />
                      <Tooltip />
                      <Bar
                        key="posts"
                        dataKey="posts"
                        fill="#FFD700"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-bs-neutral-600 mt-2 text-center">
                    Avg: {sentiment.postsPerWeekAvg} posts/week (Target: 3+)
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 6. Action Center */}
          <section aria-labelledby="action-center">
            <h2 id="action-center" className="mb-4">
              Action Center
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border-2 border-bs-red p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-bs-red" size={24} />
                  <h3 className="font-bold text-bs-neutral-900">
                    Top 3 Issues
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
                    <div className="font-medium text-bs-neutral-900">
                      Low Instagram engagement
                    </div>
                    <div className="text-sm text-bs-neutral-600 mt-1">
                      Impact: High
                    </div>
                  </div>
                  <div className="p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
                    <div className="font-medium text-bs-neutral-900">
                      Negative Google reviews trending
                    </div>
                    <div className="text-sm text-bs-neutral-600 mt-1">
                      Impact: High
                    </div>
                  </div>
                  <div className="p-3 bg-bs-gold/5 border border-bs-gold/20 rounded-lg">
                    <div className="font-medium text-bs-neutral-900">
                      Keyword mismatch
                    </div>
                    <div className="text-sm text-bs-neutral-600 mt-1">
                      Impact: Medium
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 bg-bs-blue text-white rounded-lg hover:bg-bs-blue/90 transition-colors">
                  View Details
                </button>
              </div>

              <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="text-bs-gold" size={24} />
                  <h3 className="font-bold text-bs-neutral-900">Quick Fixes</h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handleQuickFix("reply-reviews")}
                    className="w-full py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium"
                  >
                    Reply to Reviews
                  </button>
                  <button
                    onClick={() => handleQuickFix("post-instagram")}
                    className="w-full py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium"
                  >
                    Post on Instagram
                  </button>
                  <button
                    onClick={() => handleQuickFix("update-keywords")}
                    className="w-full py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium"
                  >
                    Update Keywords
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Promotion Suggestion Cards */}
          <section aria-labelledby="promotion-suggestions">
            <h2 id="promotion-suggestions" className="mb-4">
              Promotion Suggestions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-bs-gold/10 to-bs-gold/5 border-2 border-bs-gold rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="text-bs-gold" size={20} />
                  <h3 className="font-bold text-bs-neutral-900">
                    Family Dinner Friday
                  </h3>
                </div>
                <p className="text-sm text-bs-neutral-700 mb-4">
                  Offer a 10% discount for families at 7 PM peak hour.
                </p>
                <button className="w-full py-2 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium text-sm">
                  Post on Instagram with #FamilyDinner
                </button>
              </div>

              <div className="bg-gradient-to-br from-bs-red/10 to-bs-red/5 border-2 border-bs-red rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="text-bs-red" size={20} />
                  <h3 className="font-bold text-bs-neutral-900">
                    Spicy Noodles Trend
                  </h3>
                </div>
                <p className="text-sm text-bs-neutral-700 mb-4">
                  Add "Spicy Noodles" to your menu description to match trending
                  searches.
                </p>
                <button
                  onClick={() => handleQuickFix("update-keywords")}
                  className="w-full py-2 bg-bs-red text-white rounded-lg hover:bg-bs-red/90 transition-colors font-medium text-sm"
                >
                  Update Keywords
                </button>
              </div>

              <div className="bg-gradient-to-br from-bs-blue/10 to-bs-blue/5 border-2 border-bs-blue rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="text-bs-blue" size={20} />
                  <h3 className="font-bold text-bs-neutral-900">
                    TikTok Challenge
                  </h3>
                </div>
                <p className="text-sm text-bs-neutral-700 mb-4">
                  Encourage customers to post short clips with
                  #QuickLunchChallenge.
                </p>
                <button className="w-full py-2 bg-bs-blue text-white rounded-lg hover:bg-bs-blue/90 transition-colors font-medium text-sm">
                  View Example Posts
                </button>
              </div>

              <div className="bg-gradient-to-br from-bs-green/10 to-bs-green/5 border-2 border-bs-green rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="text-bs-green" size={20} />
                  <h3 className="font-bold text-bs-neutral-900">
                    Promotion Management
                  </h3>
                </div>
                <p className="text-sm text-bs-neutral-700 mb-4">
                  Create, edit and manage your restaurant promotions and special
                  offers.
                </p>
                <button
                  onClick={() => navigate("/promotion")}
                  className="w-full py-2 bg-bs-green text-bs-neutral-900 rounded-lg hover:brightness-110 transition-colors font-medium text-sm"
                >
                  Manage Promotions
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-bs-neutral-200 shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-90 py-4 flex flex-col sm:flex-row gap-3">
          <button className="flex-1 px-4 py-3 bg-bs-neutral-900 text-white rounded-lg hover:bg-bs-neutral-800 transition-colors font-bold">
            Download Report
          </button>
        </div>
      </div>

      {/* Theme Reviews Modal */}
      {themeReviewsData !== null && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50"
          onClick={() => setThemeReviewsData(null)}
        >
          <div
            className="bg-white rounded-lg border-2 border-bs-neutral-200 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-bs-neutral-200">
              <h3 className="font-bold text-bs-neutral-900">
                Negative Reviews &middot; "{selectedTheme}"
              </h3>
              <button
                onClick={() => setThemeReviewsData(null)}
                className="text-bs-neutral-500 hover:text-bs-neutral-900 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {loadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-bs-blue" size={24} />
                </div>
              ) : (
                <>
                  <p className="text-sm text-bs-neutral-600 mb-3">
                    <span className="font-bold text-bs-red">
                      {themeReviewsData.matchedCount}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold">
                      {themeReviewsData.totalNegative}
                    </span>{" "}
                    negative reviews mention this complaint
                  </p>
                  {themeReviewsData.reviews.length === 0 ? (
                    <p className="text-sm text-bs-neutral-500">
                      No negative reviews found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {themeReviewsData.reviews.map((rev, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            rev.matched
                              ? "border-bs-red/30 bg-bs-red/5"
                              : "border-bs-neutral-100 bg-bs-neutral-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-bs-gold">
                              {"★".repeat(rev.stars)}
                              {"☆".repeat(5 - rev.stars)}
                            </span>
                            {rev.matched && (
                              <span className="text-xs bg-bs-red/10 text-bs-red px-2 py-0.5 rounded-full font-medium">
                                Match
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-bs-neutral-700 leading-relaxed">
                            "{rev.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-4 border-t border-bs-neutral-200">
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-bs-blue hover:underline"
              >
                <ExternalLink size={14} />
                Open full Google Reviews
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedModal && modals[selectedModal as keyof typeof modals] && (
        <ActionModal
          isOpen={true}
          onClose={() => setSelectedModal(null)}
          title={modals[selectedModal as keyof typeof modals].title}
          content={modals[selectedModal as keyof typeof modals].content}
          suggestedText={
            modals[selectedModal as keyof typeof modals].suggestedText
          }
          suggestedHashtags={
            modals[selectedModal as keyof typeof modals].suggestedHashtags
          }
        />
      )}
    </div>
  );
}
