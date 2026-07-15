import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Star,
  ThumbsUp,
  Repeat,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Lightbulb,
  Megaphone,
  Loader2,
} from "lucide-react";
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
  LabelList,
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
  getFootTraffic,
  getActionSuggestions,
  formatTrendText,
  trendColorClass,
  EMPTY_SUMMARY,
  EMPTY_SENTIMENT,
  EMPTY_FUNNEL_STAGES,
  EMPTY_FOOT_TRAFFIC,
  normalizeSummary,
  normalizeFunnelStages,
  normalizeSentiment,
  normalizeFootTraffic,
  normalizeSocialPlatforms,
  type SummaryMetrics,
  type FunnelStage,
  type SocialPlatformCard,
  type Sentiment,
  type RestaurantItem,
  type ReviewsByTheme,
  type FootTrafficResponse,
  type ActionSuggestionsResponse,
} from "../services/visibilityApi";

export default function SocialVisibilityDashboard() {
  const navigate = useNavigate();

  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("metrics");

  const tabs = [
    { id: "metrics", label: "Top Metrics" },
    { id: "funnel", label: "Traffic & Conversion" },
    { id: "reviews", label: "Google Reviews" },
    { id: "sentiment", label: "Sentiment" },
    { id: "traffic", label: "Foot Traffic" },
    { id: "promotions", label: "Promotions" },
  ];

  // --- Data state (always start with safe zero defaults) ---
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [summary, setSummary] = useState<SummaryMetrics>(EMPTY_SUMMARY);
  const [funnel, setFunnel] = useState<FunnelStage[]>(EMPTY_FUNNEL_STAGES);
  const [social, setSocial] = useState<SocialPlatformCard[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment>(EMPTY_SENTIMENT);
  const [footTraffic, setFootTraffic] =
    useState<FootTrafficResponse>(EMPTY_FOOT_TRAFFIC);
  const [loading, setLoading] = useState(false);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // â"€â"€ Theme reviews popup â"€â"€
  const [themeReviewsData, setThemeReviewsData] =
    useState<ReviewsByTheme | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [loadingReviews, setLoadingReviews] = useState(false);

  // -- Action suggestions --
  const [actionSuggestions, setActionSuggestions] =
    useState<ActionSuggestionsResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleViewSuggestions = async () => {
    if (!selectedRestaurantId) return;
    setShowSuggestions(true);
    if (!actionSuggestions) {
      try {
        const data = await getActionSuggestions(selectedRestaurantId);
        setActionSuggestions(data);
      } catch {
        setActionSuggestions(null);
      }
    }
  };

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

  // --- Load restaurant list on mount ---
  useEffect(() => {
    setRestaurantsLoading(true);
    fetchRestaurants()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) {
          setSelectedRestaurantId(list[0].id);
        }
      })
      .catch(() =>
        setError("Failed to load restaurants. Is the backend running?"),
      )
      .finally(() => setRestaurantsLoading(false));
  }, []);

  // --- Fetch all dashboard data when restaurant changes ---
  const loadDashboard = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    setActionSuggestions(null);
    try {
      const results = await Promise.allSettled([
        getSummaryMetrics(id),
        getFunnelMetrics(id),
        getSocialVisibility(id),
        getSentiment(id),
        getFootTraffic(id),
      ]);

      const labels = [
        "summary metrics",
        "funnel metrics",
        "social visibility",
        "sentiment",
        "foot traffic",
      ];
      const failed = results
        .map((r, i) => (r.status === "rejected" ? labels[i] : null))
        .filter(Boolean);

      const [summaryRes, funnelRes, socialRes, sentimentRes, trafficRes] =
        results;

      setSummary(
        summaryRes.status === "fulfilled"
          ? normalizeSummary(summaryRes.value)
          : EMPTY_SUMMARY,
      );
      setFunnel(
        funnelRes.status === "fulfilled"
          ? normalizeFunnelStages(funnelRes.value?.stages)
          : EMPTY_FUNNEL_STAGES.map((s) => ({ ...s })),
      );
      setSocial(
        socialRes.status === "fulfilled"
          ? normalizeSocialPlatforms(socialRes.value?.platforms)
          : [],
      );
      setSentiment(
        sentimentRes.status === "fulfilled"
          ? normalizeSentiment(sentimentRes.value)
          : EMPTY_SENTIMENT,
      );
      setFootTraffic(
        trafficRes.status === "fulfilled"
          ? normalizeFootTraffic(trafficRes.value, id)
          : { ...EMPTY_FOOT_TRAFFIC, restaurantId: id },
      );

      if (failed.length > 0) {
        setError(
          `Some data unavailable (${failed.join(", ")}). Showing defaults of 0.`,
        );
      }

      getActionSuggestions(id)
        .then(setActionSuggestions)
        .catch(() => setActionSuggestions(null));
    } catch {
      setSummary(EMPTY_SUMMARY);
      setFunnel(EMPTY_FUNNEL_STAGES.map((s) => ({ ...s })));
      setSocial([]);
      setSentiment(EMPTY_SENTIMENT);
      setFootTraffic({ ...EMPTY_FOOT_TRAFFIC, restaurantId: id });
      setError(
        "Failed to load dashboard data. Showing defaults of 0.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRestaurantId !== null) {
      loadDashboard(selectedRestaurantId);
    }
  }, [selectedRestaurantId, loadDashboard]);

  // --- Derived chart data (always defined; zeros when empty) ---
  const sentimentPieData = [
    {
      name: "Positive",
      value: sentiment.positivePct ?? 0,
      color: "#27AE60",
    },
    {
      name: "Negative",
      value: sentiment.negativePct ?? 0,
      color: "#FF4C4C",
    },
    { name: "Neutral", value: sentiment.neutralPct ?? 0, color: "#F59E0B" },
  ];

  const complaintThemeData = (sentiment.complaintThemes ?? []).map((c) => ({
    theme: c.theme,
    count: c.count ?? 0,
  }));

  // â"€â"€ Helper: find drop-off stage â"€â"€
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
        "Join us for our famous Spicy Noodle Challenge! 🌶️ Tag us in your food adventures!",
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

  // --- Loading / Error / Empty states ---
  // Only show a full-page spinner while restaurants are still loading (active fetch).
  if (restaurantsLoading) {
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
              <h1 className="mb-2">Visibility & Insights Dashboard</h1>
              <p className="text-bs-neutral-600">
                Understand your traffic and visibility with actionable insights
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

      {loading && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-bs-blue" size={40} />
        </div>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto py-4 border-b border-bs-neutral-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-bs-blue border border-bs-neutral-200 border-b-white -mb-px"
                    : "text-bs-neutral-500 hover:text-bs-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-8">
          {activeTab === "metrics" && (
            <>
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
            </>
          )}

          {activeTab === "funnel" && (
            <>
              {/* 2. Traffic & Conversion Funnel */}
              <section aria-labelledby="traffic-funnel">
                <h2 id="traffic-funnel" className="mb-4">
                  Traffic & Conversion Funnel
                </h2>
                <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 mt-4">
                  <h3 className="mb-4">Conversion Funnel</h3>
                  <FunnelChart
                    stages={funnel.filter(
                      (s) => s.name !== "Visits" && s.name !== "Reviews",
                    )}
                  />

                  {dropOffStage && (
                    <div className="mt-4 p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-bs-neutral-900">
                        <AlertCircle size={16} className="text-bs-red" />
                        <span className="font-medium">Drop-off detected:</span>
                        <span>
                          {dropOffStage.name} conversion is{" "}
                          {dropOffStage.conversion ?? 0}% below average
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === "reviews" && (
            <>
              {/* 3. Social Media Visibility */}
              <section aria-labelledby="social-visibility">
                <h2 id="social-visibility" className="mb-4">
                  Google Review Visibility
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {social
                    .filter((p) => p.platform === "Google Reviews")
                    .map((p) => (
                      <SocialMediaCard
                        key={p.platform}
                        platform={p.platform}
                        icon={<Star size={24} />}
                        metrics={p.metrics}
                        ctaLabel={`Open ${p.platform}`}
                        url={p.url}
                        color="text-bs-gold"
                      />
                    ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "sentiment" && (
            <>
              {/* 4. Customer Sentiment & Awareness */}
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
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-bs-green">
                          {sentiment.positivePct ?? 0}%
                        </div>
                        <div className="text-sm text-bs-neutral-600">
                          Positive
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-bs-red">
                          {sentiment.negativePct ?? 0}%
                        </div>
                        <div className="text-sm text-bs-neutral-600">
                          Negative
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#F59E0B]">
                          {sentiment.neutralPct ?? 0}%
                        </div>
                        <div className="text-sm text-bs-neutral-600">
                          Neutral
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
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E5E5"
                        />
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
                            [...complaintThemeData].sort(
                              (a, b) => b.count - a.count,
                            )[0].theme
                          }{" "}
                          (
                          {
                            [...complaintThemeData].sort(
                              (a, b) => b.count - a.count,
                            )[0].count
                          }{" "}
                          mentions)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "traffic" && (
            <>
              {/* 5. Foot Traffic & Staff Scheduling */}
              {(() => {
                  // ── Derived from API (defaults to 0 when empty/missing) ──
                  const days = [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ];
                  const weekdayAvg = footTraffic.daily?.weekdayAvg ?? 0;
                  const weekendAvg = footTraffic.daily?.weekendAvg ?? 0;
                  const hourly = footTraffic.hourly ?? [];
                  // Only invent day-level variation when backend actually returned averages
                  const hasDailyData = weekdayAvg > 0 || weekendAvg > 0;
                  const hasHourlyData = hourly.some(
                    (h) => (h.weekdayAvg ?? 0) > 0 || (h.weekendAvg ?? 0) > 0,
                  );

                  const dailyTraffic = days.map((day, i) => ({
                    date: `2026-06-0${i + 1}`,
                    day,
                    visits: hasDailyData
                      ? Math.max(
                          0,
                          Math.round(
                            i < 5
                              ? weekdayAvg + (i - 2) * 3
                              : weekendAvg + (i - 5.5) * 8,
                          ),
                        )
                      : 0,
                    type: (i < 5 ? "weekday" : "weekend") as
                      | "weekday"
                      | "weekend",
                  }));

                  const hours24 = [12, 13, 19];
                  const heatmapTraffic = days.flatMap((day, di) =>
                    hours24.map((h) => ({
                      date: `2026-06-0${di + 1}`,
                      day,
                      hour: h,
                      visitors: Math.round(
                        hourly.find((x) => x.hour === h)?.[
                          di < 5 ? "weekdayAvg" : "weekendAvg"
                        ] ?? 0,
                      ),
                      type: (di < 5 ? "weekday" : "weekend") as
                        | "weekday"
                        | "weekend",
                    })),
                  );

                  const getHourAvg = (hour: number, isWeekend: boolean) => {
                    const row = hourly.find((x) => x.hour === hour);
                    if (!row) return 0;
                    const value = isWeekend ? row.weekendAvg : row.weekdayAvg;
                    return Math.max(0, Math.round(value ?? 0));
                  };

                  // Keep 7 zero-filled rows when no hourly data so the chart still renders
                  const stackedData = days.map((day, i) => {
                    const isWeekend = i >= 5;
                    const lunch = hasHourlyData ? getHourAvg(12, isWeekend) : 0;
                    const afternoon = hasHourlyData
                      ? getHourAvg(13, isWeekend)
                      : 0;
                    const dinner = hasHourlyData ? getHourAvg(19, isWeekend) : 0;
                    const morning = 0;
                    const lateNight = 0;
                    return {
                      label: `${day.slice(0, 3)} Jun ${i + 1}`,
                      morning,
                      lunch,
                      afternoon,
                      dinner,
                      lateNight,
                      total: morning + lunch + afternoon + dinner + lateNight,
                    };
                  });

                  const weekdayTraffic = {
                    value: weekdayAvg,
                    days: 5,
                  };
                  const weekendTraffic = {
                    value: weekendAvg,
                    days: 2,
                  };

                  const shiftRows = [
                    {
                      period: "📅 Weekday",
                      shift: "11 AM -- 2 PM",
                      staff: "3",
                      note: "Lunch peak Mon--Thu -- ~60--95 visitors/hr",
                      bg: "#EFF6FF",
                      badge: "#BFDBFE",
                      badgeText: "#1E3A8A",
                    },
                    {
                      period: "📅 Weekday",
                      shift: "6 PM -- 9 PM",
                      staff: "3--4",
                      note: "Monday evening spike -- 80 visitors/hr",
                      bg: "#EFF6FF",
                      badge: "#BFDBFE",
                      badgeText: "#1E3A8A",
                    },
                    {
                      period: "📅 Weekday",
                      shift: "2 PM -- 5 PM",
                      staff: "1--2",
                      note: "Afternoon lull -- minimal coverage",
                      bg: "#EFF6FF",
                      badge: "#BFDBFE",
                      badgeText: "#1E3A8A",
                    },
                    {
                      period: "🎉 Weekend",
                      shift: "5 PM -- 9 PM",
                      staff: "5--6",
                      note: "Dinner peak Sat 6 PM (120) & Sun 7 PM (140)",
                      bg: "#FFF7ED",
                      badge: "#FED7AA",
                      badgeText: "#9A3412",
                    },
                    {
                      period: "🎉 Weekend",
                      shift: "11 AM -- 2 PM",
                      staff: "4",
                      note: "Strong weekend lunch -- Sat/Sun 120--130/hr",
                      bg: "#FFF7ED",
                      badge: "#FED7AA",
                      badgeText: "#9A3412",
                    },
                    {
                      period: "🎉 Weekend",
                      shift: "9 PM -- close",
                      staff: "2--3",
                      note: "Wind-down -- lighter but sustained",
                      bg: "#FFF7ED",
                      badge: "#FED7AA",
                      badgeText: "#9A3412",
                    },
                  ];

                  return (
                    <section aria-labelledby="foot-traffic">
                      <h2 id="foot-traffic" className="mb-1">
                        Weekdays vs Weekends Foot Traffic
                      </h2>
                      <p className="text-sm text-bs-neutral-500 mb-6">
                        Daily visit counts -- use to design staff schedules
                      </p>

                      {/* Chart 1: Daily bar chart */}
                      <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6 mb-6">
                        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                          <div>
                            <h3 className="font-bold text-bs-neutral-900">
                              Daily Foot Traffic (Weekdays vs Weekends)
                            </h3>
                            <p className="text-xs text-bs-neutral-500 mt-0.5">
                              Jun 1--7, 2026 · hover bar for date, day & visit
                              count
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-bs-neutral-600">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-sm inline-block"
                                style={{ background: "#2D9CDB" }}
                              />
                              Weekday
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-sm inline-block"
                                style={{ background: "#F97316" }}
                              />
                              Weekend
                            </span>
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart
                            data={dailyTraffic}
                            barCategoryGap="28%"
                            margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid vertical={false} stroke="#E5E5E5" />
                            <XAxis
                              dataKey="day"
                              tickFormatter={(v: string) => v.slice(0, 3)}
                              tick={{ fontSize: 12, fill: "#525252" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: "#737373" }}
                              axisLine={false}
                              tickLine={false}
                              label={{
                                value: "visits",
                                angle: -90,
                                position: "insideLeft",
                                offset: 10,
                                style: { fontSize: 10, fill: "#A3A3A3" },
                              }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0]
                                  .payload as (typeof dailyTraffic)[0];
                                return (
                                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
                                    <p className="font-semibold text-gray-800">
                                      {d.day}, {d.date}
                                    </p>
                                    <p
                                      style={{
                                        color:
                                          d.type === "weekday"
                                            ? "#2D9CDB"
                                            : "#F97316",
                                      }}
                                    >
                                      {d.visits} visits ·{" "}
                                      {d.type === "weekday"
                                        ? "Weekday"
                                        : "Weekend"}
                                    </p>
                                  </div>
                                );
                              }}
                            />
                            <Bar
                              dataKey="visits"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={64}
                            >
                              {dailyTraffic.map((d, i) => (
                                <Cell
                                  key={`day-${i}`}
                                  fill={
                                    d.type === "weekday" ? "#2D9CDB" : "#F97316"
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>

                        {/* Day-level stat chips */}
                        <div className="grid grid-cols-7 gap-1 mt-4">
                          {dailyTraffic.map((d, i) => (
                            <div
                              key={i}
                              className="text-center rounded-lg py-2 px-1"
                              style={{
                                background:
                                  d.type === "weekday" ? "#EFF6FF" : "#FFF7ED",
                              }}
                            >
                              <p
                                className="text-[10px] font-semibold"
                                style={{
                                  color:
                                    d.type === "weekday"
                                      ? "#1D4ED8"
                                      : "#C2410C",
                                }}
                              >
                                {d.day.slice(0, 3)}
                              </p>
                              <p className="text-sm font-bold text-bs-neutral-900 mt-0.5">
                                {d.visits}
                              </p>
                              <p className="text-[9px] text-bs-neutral-400">
                                visits
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Stacked column chart ── */}
                      {(() => {
                        const segments = [
                          {
                            key: "morning",
                            label: "Morning (8–11 AM)",
                            color: "#93C5FD",
                          },
                          {
                            key: "lunch",
                            label: "Lunch (12–3 PM)",
                            color: "#22C55E",
                          },
                          {
                            key: "afternoon",
                            label: "Afternoon (3–5 PM)",
                            color: "#86EFAC",
                          },
                          {
                            key: "dinner",
                            label: "Dinner (6–9 PM)",
                            color: "#F97316",
                          },
                          {
                            key: "lateNight",
                            label: "Late Night (9–11 PM)",
                            color: "#374151",
                          },
                        ] as const;

                        // Custom label rendered inside each segment
                        const renderLabel = (props: any) => {
                          const { x, y, width, height, value } = props;
                          if (!value || height < 14) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 4}
                              textAnchor="middle"
                              fontSize={9}
                              fontWeight={600}
                              fill="#fff"
                            >
                              {value}
                            </text>
                          );
                        };

                        // Custom total label above each column
                        const renderTotal = (props: any) => {
                          const { x, y, width, value } = props;
                          if (!value) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 4}
                              textAnchor="middle"
                              fontSize={10}
                              fontWeight={700}
                              fill="#262626"
                            >
                              {value}
                            </text>
                          );
                        };

                        return (
                          <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6 mb-6">
                            <h3 className="font-bold text-bs-neutral-900 mb-1">
                              Hourly Foot Traffic (Jun 1–7, 2026)
                            </h3>
                            <p className="text-xs text-bs-neutral-500 mb-4">
                              Restaurant visits per day broken down by time
                              period
                            </p>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
                              {segments.map((s) => (
                                <span
                                  key={s.key}
                                  className="flex items-center gap-1.5 text-xs text-bs-neutral-700"
                                >
                                  <span
                                    className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                                    style={{ background: s.color }}
                                  />
                                  {s.label}
                                </span>
                              ))}
                            </div>

                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart
                                data={stackedData}
                                barCategoryGap="22%"
                                margin={{
                                  top: 24,
                                  right: 8,
                                  left: 0,
                                  bottom: 0,
                                }}
                              >
                                <CartesianGrid
                                  vertical={false}
                                  stroke="#E5E5E5"
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fontSize: 10, fill: "#525252" }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[0, 180]}
                                  tick={{ fontSize: 11, fill: "#737373" }}
                                  axisLine={false}
                                  tickLine={false}
                                  label={{
                                    value: "Visits",
                                    angle: -90,
                                    position: "insideLeft",
                                    offset: 12,
                                    style: { fontSize: 10, fill: "#A3A3A3" },
                                  }}
                                />
                                <Tooltip
                                  content={({ active, payload, label }) => {
                                    if (!active || !payload?.length)
                                      return null;
                                    const total = (payload as any[]).reduce(
                                      (s: number, p: any) => s + (p.value ?? 0),
                                      0,
                                    );
                                    return (
                                      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs min-w-[160px]">
                                        <p className="font-bold text-gray-800 mb-1">
                                          {label}
                                        </p>
                                        {[...(payload as any[])]
                                          .reverse()
                                          .map((p: any) => (
                                            <p
                                              key={p.dataKey}
                                              style={{ color: p.fill }}
                                              className="flex justify-between gap-4"
                                            >
                                              <span>{p.name}</span>
                                              <span className="font-semibold">
                                                {p.value}
                                              </span>
                                            </p>
                                          ))}
                                        <p className="border-t border-gray-100 mt-1 pt-1 font-bold text-gray-800 flex justify-between">
                                          <span>Total</span>
                                          <span>{total}</span>
                                        </p>
                                      </div>
                                    );
                                  }}
                                />

                                {segments.map((s, si) => (
                                  <Bar
                                    key={s.key}
                                    dataKey={s.key}
                                    stackId="stack"
                                    fill={s.color}
                                    name={s.label}
                                    radius={
                                      si === segments.length - 1
                                        ? [4, 4, 0, 0]
                                        : [0, 0, 0, 0]
                                    }
                                  >
                                    <LabelList
                                      dataKey={s.key}
                                      content={renderLabel}
                                    />
                                    {/* Render total above the full stack on the topmost segment only */}
                                    {si === segments.length - 1 && (
                                      <LabelList
                                        dataKey="total"
                                        position="top"
                                        content={renderTotal}
                                      />
                                    )}
                                  </Bar>
                                ))}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}

                      {/* Action Center + Staffing Insight */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Action Center */}
                        <div className="bg-white rounded-xl border-2 border-bs-neutral p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-bs-red" size={24} />
                            <h3 className="font-bold text-bs-neutral-900">
                              Top 3 Issues
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {actionSuggestions?.suggestions.map((s, i) => (
                              <div
                                key={i}
                                className={`p-3 rounded-lg border ${
                                  s.impact === "High"
                                    ? "bg-bs-red/5 border-bs-red/20"
                                    : s.impact === "Medium"
                                      ? "bg-bs-gold/5 border-bs-gold/20"
                                      : "bg-bs-green/5 border-bs-green/20"
                                }`}
                              >
                                <div className="font-medium text-bs-neutral-900 text-sm">
                                  {s.issue}
                                </div>
                                <div className="text-xs text-bs-neutral-600 mt-1">
                                  Impact: {s.impact}
                                </div>
                              </div>
                            )) ?? (
                              <>
                                <div className="p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
                                  <div className="font-medium text-bs-neutral-900">
                                    Low engagement
                                  </div>
                                  <div className="text-sm text-bs-neutral-600 mt-1">
                                    Impact: High
                                  </div>
                                </div>
                                <div className="p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
                                  <div className="font-medium text-bs-neutral-900">
                                    Negative reviews
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
                              </>
                            )}
                          </div>
                          <button
                            onClick={handleViewSuggestions}
                            className="w-full mt-4 py-2 bg-bs-blue text-white rounded-lg hover:bg-bs-blue/90 transition-colors text-sm font-medium"
                          >
                            View Suggestions
                          </button>
                        </div>

                        {/* Right: Staffing Insight */}
                        <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6">
                          <h3 className="font-bold text-bs-neutral-900 mb-4">
                            Staffing Insight
                          </h3>
                          <div className="space-y-3">
                            <div
                              className="p-3 rounded-lg border border-blue-200"
                              style={{ background: "#EFF6FF" }}
                            >
                              <p className="text-xs font-bold text-blue-700 mb-1">
                                📅 Weekdays (Mon--Fri) -- avg{" "}
                                {weekdayTraffic.value} visitors/day
                              </p>
                              <p className="text-sm text-bs-neutral-700">
                                Lunch peak at{" "}
                                <strong>1 PM (60 visitors Mon)</strong>.
                                Standard crew sufficient. Evening at 7 PM adds
                                80 visitors -- moderate cover needed.
                              </p>
                            </div>
                            <div
                              className="p-3 rounded-lg border border-orange-200"
                              style={{ background: "#FFF7ED" }}
                            >
                              <p className="text-xs font-bold text-orange-700 mb-1">
                                🎉 Weekends (Sat--Sun) -- avg{" "}
                                {weekendTraffic.value} visitors/day
                              </p>
                              <p className="text-sm text-bs-neutral-700">
                                Peak at{" "}
                                <strong>7 PM Sunday (140 visitors)</strong>.
                                Saturday dinner at 6 PM hits 120/hr. Scale up
                                kitchen + floor staff <strong>5 -- 9 PM</strong>{" "}
                                both days.
                              </p>
                            </div>
                            <div
                              className="p-3 rounded-lg border border-bs-neutral-200"
                              style={{ background: "#F5F5F5" }}
                            >
                              <p className="text-xs font-bold text-bs-neutral-600 mb-1">
                                💡 Scheduling tip
                              </p>
                              <p className="text-sm text-bs-neutral-600">
                                Friday already sees 110 visits -- treat Friday
                                evenings like a weekend shift. Rotate 1--2 staff
                                from weekday lulls to cover the weekend surge.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6">
                    <h4 className="font-bold text-bs-neutral-800 mb-3">
                      Recommended Shift Slots
                      <span className="ml-2 text-xs font-normal text-bs-neutral-500">
                        (from traffic data above)
                      </span>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-bs-neutral-200">
                            <th className="pb-2 pr-3 text-left text-xs font-semibold text-bs-neutral-500 uppercase tracking-wide">
                              Period
                            </th>
                            <th className="pb-2 pr-3 text-left text-xs font-semibold text-bs-neutral-500 uppercase tracking-wide">
                              Shift
                            </th>
                            <th className="pb-2 pr-3 text-left text-xs font-semibold text-bs-neutral-500 uppercase tracking-wide">
                              Staff
                            </th>
                            <th className="pb-2 text-left text-xs font-semibold text-bs-neutral-500 uppercase tracking-wide">
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-bs-neutral-100">
                          {shiftRows.map((row, i) => (
                            <tr key={i} style={{ background: row.bg }}>
                              <td className="py-2 pr-3 font-medium text-bs-neutral-800 whitespace-nowrap text-xs">
                                {row.period}
                              </td>
                              <td className="py-2 pr-3 font-mono text-xs text-bs-neutral-700 whitespace-nowrap">
                                {row.shift}
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold"
                                  style={{
                                    background: row.badge,
                                    color: row.badgeText,
                                  }}
                                >
                                  {row.staff}
                                </span>
                              </td>
                              <td className="py-2 text-xs text-bs-neutral-600">
                                {row.note}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div> */}
                      </div>
                    </section>
                  );
                })()}
            </>
          )}

          {activeTab === "promotions" && (
            <>
              {/* 6. Promotion Suggestion Cards */}
              <section aria-labelledby="promotion-suggestions">
                <h2 id="promotion-suggestions" className="mb-4">
                  Promotion Suggestions
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-bs-gold/10 to-bs-gold/5 border-2 border-bs-gold rounded-lg p-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="text-bs-gold" size={20} />
                          <h3 className="font-bold text-bs-neutral-900">
                            Family Dinner Friday
                          </h3>
                        </div>
                        <p className="text-sm text-bs-neutral-700 mb-4">
                          Offer a 10% discount for families at 8 PM so that you
                          can eat with your loved ones.
                        </p>
                      </div>
                      <button
                        onClick={() => handleQuickFix("post-instagram")}
                        className="w-full py-2 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium text-sm"
                      >
                        Post on Instagram
                      </button>
                    </div>

                    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-bs-red/10 to-bs-red/5 border-2 border-bs-red rounded-lg p-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="text-bs-red" size={20} />
                          <h3 className="font-bold text-bs-neutral-900">
                            Spicy Noodles Trend
                          </h3>
                        </div>
                        <p className="text-sm text-bs-neutral-700 mb-4">
                          Add "Spicy Noodles" to your menu description to match
                          trending searches.
                        </p>
                      </div>
                      <button
                        onClick={() => handleQuickFix("update-keywords")}
                        className="w-full py-2 bg-bs-red text-bs-neutral-900 rounded-lg hover:bg-bs-red/90 transition-colors font-medium text-sm"
                      >
                        Update Keywords
                      </button>
                    </div>

                    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-bs-blue/10 to-bs-blue/5 border-2 border-bs-blue rounded-lg p-6">
                      <div>
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
                      </div>
                      <button className="w-full py-2 bg-bs-blue text-bs-neutral-900 rounded-lg hover:bg-bs-blue/90 transition-colors font-medium text-sm">
                        View Example Posts
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-bs-green/10 to-bs-green/5 border-2 border-bs-green rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-bs-green/20 rounded-lg text-bs-green shrink-0">
                        <Megaphone className="text-bs-green" size={22} />
                      </div>
                      <h3 className="font-bold text-bs-neutral-900 text-lg">
                        Promotion Management
                      </h3>
                    </div>
                    <p className="text-sm text-bs-neutral-700">
                      Create, edit and manage your restaurant promotions. Set up
                      new deals, schedule campaigns, and track active discounts.
                    </p>
                    <div>
                      <button
                        onClick={() => navigate("/promotion")}
                        className="w-full py-2.5 bg-bs-green text-bs-neutral-900 rounded-lg hover:brightness-110 transition-colors font-bold text-sm shadow-sm"
                      >
                        Manage Promotions
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
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

      {/* Suggestions Modal */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50"
          onClick={() => setShowSuggestions(false)}
        >
          <div
            className="bg-white rounded-xl border-2 border-bs-neutral-200 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-bs-neutral-200">
              <h3 className="font-bold text-bs-neutral-900">
                AI-Powered Recommendations
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-bs-neutral-500 hover:text-bs-neutral-900 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs text-bs-neutral-500 mb-4">
                Based on your restaurant's visibility metrics, review sentiment,
                social engagement, and foot traffic patterns.
              </p>
              {!actionSuggestions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-bs-blue" size={24} />
                </div>
              ) : (
                <div className="space-y-4">
                  {actionSuggestions.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border ${
                        s.impact === "High"
                          ? "border-bs-red/30 bg-bs-red/5"
                          : s.impact === "Medium"
                            ? "border-bs-gold/30 bg-bs-gold/5"
                            : "border-bs-green/30 bg-bs-green/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            s.impact === "High"
                              ? "bg-bs-red/10 text-bs-red"
                              : s.impact === "Medium"
                                ? "bg-bs-gold/10 text-bs-gold"
                                : "bg-bs-green/10 text-bs-green"
                          }`}
                        >
                          {s.impact}
                        </span>
                        <span className="font-bold text-bs-neutral-900 text-sm">
                          {s.issue}
                        </span>
                      </div>
                      <p className="text-sm text-bs-neutral-700 leading-relaxed">
                        {s.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
