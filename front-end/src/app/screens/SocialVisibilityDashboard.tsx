import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
// import { ExternalLink } from "lucide-react";
import { ActionModal } from "../components/visibility-dashboard/ActionModal";
import {
  fetchRestaurants,
  getSummaryMetrics,
  getFunnelMetrics,
  getSocialVisibility,
  getSentiment,
  getReviewsByTheme,
  getFootTraffic,
  getDemographics,
  getActionSuggestions,
  EMPTY_SUMMARY,
  EMPTY_SENTIMENT,
  EMPTY_FUNNEL_STAGES,
  EMPTY_FOOT_TRAFFIC,
  EMPTY_DEMOGRAPHICS,
  normalizeSummary,
  normalizeFunnelStages,
  normalizeSentiment,
  normalizeFootTraffic,
  normalizeDemographics,
  type SummaryMetrics,
  type FunnelStage,
  type Sentiment,
  type RestaurantItem,
  type ReviewsByTheme,
  type FootTrafficResponse,
  type CustomerDemographics,
  type ActionSuggestionsResponse,
  type ThemeSentimentType,
} from "../services/visibilityApi";
import { MetricsTab } from "../components/visibility-dashboard/MetricsTab";
import { FunnelTab } from "../components/visibility-dashboard/FunnelTab";
// import { ReviewsTab } from "../components/visibility-dashboard/ReviewsTab" disabled for now, as it is not used in the current code;
import { SentimentTab } from "../components/visibility-dashboard/SentimentTab";
import { DemographicsTab } from "../components/visibility-dashboard/DemographicsTab";
import { TrafficTab } from "../components/visibility-dashboard/TrafficTab";

export default function SocialVisibilityDashboard() {
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("metrics");

  const tabs = [
    { id: "metrics", label: "Top Metrics" },
    { id: "funnel", label: "Traffic & Conversion" },
    { id: "reviews-sentiment", label: "Sentiment" },
    { id: "demographics", label: "Customer Demographics" },
    { id: "traffic", label: "Foot Traffic" },
  ];

  // --- Data state (always start with safe zero defaults) ---
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null);
  const [summary, setSummary] = useState<SummaryMetrics>(EMPTY_SUMMARY);
  const [funnel, setFunnel] = useState<FunnelStage[]>(EMPTY_FUNNEL_STAGES);
  const [sentiment, setSentiment] = useState<Sentiment>(EMPTY_SENTIMENT);
  const [demographics, setDemographics] =
    useState<CustomerDemographics>(EMPTY_DEMOGRAPHICS);
  const [footTraffic, setFootTraffic] =
    useState<FootTrafficResponse>(EMPTY_FOOT_TRAFFIC);
  const [loading, setLoading] = useState(false);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // â"€â"€ Theme reviews popup â"€â"€
  const [themeReviewsData, setThemeReviewsData] =
    useState<ReviewsByTheme | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [selectedThemeSentiment, setSelectedThemeSentiment] =
    useState<ThemeSentimentType>("Negative");
  const [loadingReviews, setLoadingReviews] = useState(false);

  // -- Action suggestions --
  const [actionSuggestions, setActionSuggestions] =
    useState<ActionSuggestionsResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // const handleViewSuggestions = async () => {
  //   if (!selectedRestaurantId) return;
  //   setShowSuggestions(true);
  //   if (!actionSuggestions) {
  //     try {
  //       const data = await getActionSuggestions(selectedRestaurantId);
  //       setActionSuggestions(data);
  //     } catch {
  //       setActionSuggestions(null);
  //     }
  //   }
  // };

  const handleThemeClick = async (
    theme: string,
    sentimentType: ThemeSentimentType = "Negative",
  ) => {
    if (!selectedRestaurantId) return;
    setSelectedTheme(theme);
    setSelectedThemeSentiment(sentimentType);
    setLoadingReviews(true);
    try {
      const data = await getReviewsByTheme(
        selectedRestaurantId,
        theme,
        sentimentType,
      );
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
  const loadDashboard = useCallback(async (id: string) => {
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
        getDemographics(id),
      ]);

      const labels = [
        "summary metrics",
        "funnel metrics",
        "social visibility",
        "sentiment",
        "foot traffic",
        "demographics",
      ];
      const failed = results
        .map((r, i) => (r.status === "rejected" ? labels[i] : null))
        .filter(Boolean);

      const [
        summaryRes,
        funnelRes,
        ,
        sentimentRes,
        trafficRes,
        demographicsRes,
      ] = results;

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
      setDemographics(
        demographicsRes.status === "fulfilled"
          ? normalizeDemographics(demographicsRes.value)
          : EMPTY_DEMOGRAPHICS,
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
      setSentiment(EMPTY_SENTIMENT);
      setFootTraffic({ ...EMPTY_FOOT_TRAFFIC, restaurantId: id });
      setError("Failed to load dashboard data. Showing defaults of 0.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRestaurantId !== null) {
      loadDashboard(selectedRestaurantId);
    }
  }, [selectedRestaurantId, loadDashboard]);

  // const dropOffStage = funnel.find((s) => s.isDropOff);

  // const handleQuickFix = (action: string) => {
  //   setSelectedModal(action);
  // };

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
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
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
            <MetricsTab
              summary={summary}
              funnel={funnel}
              sentiment={sentiment}
              footTraffic={footTraffic}
            />
          )}

          {activeTab === "funnel" && (
            <FunnelTab funnel={funnel} />
            // <FunnelTab funnel={funnel} dropOffStage={dropOffStage} />
          )}

          {activeTab === "reviews-sentiment" && (
            <div className="space-y-8">
              <SentimentTab
                sentiment={sentiment}
                handleThemeClick={handleThemeClick}
              />
              {/* Google Reviews centered below the two theme charts REMOVE*/}
              {/* <ReviewsTab social={social} /> */}
            </div>
          )}

          {activeTab === "demographics" && (
            <DemographicsTab
              demographics={demographics}
              footTraffic={footTraffic}
            />
          )}

          {activeTab === "traffic" && <TrafficTab footTraffic={footTraffic} />}
        </div>
      )}

      {/* Sticky CTA Bar REMOVE TILL FURTHER NOTICE*/}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-bs-neutral-200 shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-90 py-4 flex flex-col sm:flex-row gap-3">
          <button className="flex-1 px-4 py-3 bg-bs-neutral-900 text-white rounded-lg hover:bg-bs-neutral-800 transition-colors font-bold">
            Download Report
          </button>
        </div>
      </div> */}

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
                {selectedThemeSentiment} Reviews &middot; "{selectedTheme}"
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
                    <span
                      className={`font-bold ${
                        selectedThemeSentiment === "Positive"
                          ? "text-bs-green"
                          : "text-bs-red"
                      }`}
                    >
                      {themeReviewsData.matchedCount}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold">
                      {themeReviewsData.totalNegative}
                    </span>{" "}
                    {selectedThemeSentiment.toLowerCase()} reviews mention this
                    theme
                  </p>
                  {themeReviewsData.reviews.length === 0 ? (
                    <p className="text-sm text-bs-neutral-500">
                      No {selectedThemeSentiment.toLowerCase()} reviews found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {themeReviewsData.reviews.map((rev, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            rev.matched
                              ? selectedThemeSentiment === "Positive"
                                ? "border-bs-green/30 bg-bs-green/5"
                                : "border-bs-red/30 bg-bs-red/5"
                              : "border-bs-neutral-100 bg-bs-neutral-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-bs-gold">
                              {"★".repeat(rev.stars)}
                              {"☆".repeat(5 - rev.stars)}
                            </span>
                            {rev.matched && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  selectedThemeSentiment === "Positive"
                                    ? "bg-bs-green/10 text-bs-green"
                                    : "bg-bs-red/10 text-bs-red"
                                }`}
                              >
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
            {/* REMOVE <div className="p-4 border-t border-bs-neutral-200">
              <a
                href="https://www.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-bs-blue hover:underline"
              >
                <ExternalLink size={14} />
                Open full Google Reviews
              </a>
            </div> */}
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
