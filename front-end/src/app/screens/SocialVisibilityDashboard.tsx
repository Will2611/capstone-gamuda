import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { ActionModal } from "../components/visibility-dashboard/ActionModal";
import {
  fetchRestaurants,
  getSummaryMetrics,
  getFunnelMetrics,
  getSocialVisibility,
  getSentiment,
  getReviewsByTheme,
  getFootTraffic,
  getActionSuggestions,
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
import { MetricsTab } from "../components/visibility-dashboard/MetricsTab";
import { FunnelTab } from "../components/visibility-dashboard/FunnelTab";
import { ReviewsTab } from "../components/visibility-dashboard/ReviewsTab";
import { SentimentTab } from "../components/visibility-dashboard/SentimentTab";
import { TrafficTab } from "../components/visibility-dashboard/TrafficTab";
import { PromotionsTab } from "../components/visibility-dashboard/PromotionsTab";

export default function SocialVisibilityDashboard() {
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
    string | null
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
          {activeTab === "metrics" && <MetricsTab summary={summary} />}

          {activeTab === "funnel" && (
            <FunnelTab funnel={funnel} dropOffStage={dropOffStage} />
          )}

          {activeTab === "reviews" && <ReviewsTab social={social} />}

          {activeTab === "sentiment" && (
            <SentimentTab
              sentiment={sentiment}
              handleThemeClick={handleThemeClick}
            />
          )}

          {activeTab === "traffic" && (
            <TrafficTab footTraffic={footTraffic} />
          )}

          {activeTab === "promotions" && (
            <PromotionsTab handleQuickFix={handleQuickFix} />
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
