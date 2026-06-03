import { useState } from "react";
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
import { SuggestionBanner } from "../components/visibility-dashboard/SuggestionBanner";

export default function SocialVisibilityDashboard() {
  const [selectedModal, setSelectedModal] = useState<string | null>(null);

  // Funnel data
  const funnelStages = [
    { name: "Impressions", count: 67200, conversion: 100 },
    { name: "Clicks", count: 2554, conversion: 3.8 },
    { name: "Click-to-Direction", count: 460, conversion: 18, isDropOff: true },
    { name: "Visits", count: 324, conversion: 70 },
    { name: "Reviews", count: 28, conversion: 8.6 },
  ];

  // Sentiment data
  const sentimentData = [
    { name: "Positive", value: 82, color: "#27AE60" },
    { name: "Negative", value: 18, color: "#FF4C4C" },
  ];

  // Complaint themes
  const complaintThemes = [
    { theme: "Wait Time", count: 12 },
    { theme: "Service", count: 8 },
    { theme: "Taste", count: 5 },
  ];

  // Trending keywords
  const trendingKeywords = [
    { keyword: "#SpicyNoodles", trend: "+45%" },
    { keyword: "#ThaiFood", trend: "+28%" },
    { keyword: "#LocalEats", trend: "+22%" },
    { keyword: "#FoodieChallenge", trend: "+18%" },
    { keyword: "#QuickLunch", trend: "+15%" },
  ];

  // Content freshness data
  const freshnessData = [
    { week: "W1", posts: 2, reviews: 6 },
    { week: "W2", posts: 3, reviews: 8 },
    { week: "W3", posts: 1, reviews: 7 },
    { week: "W4", posts: 4, reviews: 9 },
  ];

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

  return (
    <div className="min-h-screen bg-bs-neutral-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-bs-neutral-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="mb-2">Social Visibility & Insights Dashboard</h1>
          <p className="text-bs-neutral-600">
            Understand your traffic, visibility, and brand awareness with
            actionable insights
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 1. Top Summary Metrics */}
        <section aria-labelledby="summary-metrics">
          <h2 id="summary-metrics" className="mb-4">
            Top Summary Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Eye className="text-bs-blue" size={24} />
                <span className="text-2xl font-bold text-bs-neutral-900">
                  72/100
                </span>
              </div>
              <h3 className="text-sm text-bs-neutral-600">Visibility Score</h3>
              <p className="text-xs text-bs-red mt-1">↓ 8 vs. last month</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="text-bs-gold" size={24} />
                <span className="text-2xl font-bold text-bs-neutral-900">
                  4.6
                </span>
              </div>
              <h3 className="text-sm text-bs-neutral-600">Average Rating</h3>
              <p className="text-xs text-bs-green mt-1">324 Google Reviews</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <ThumbsUp className="text-bs-green" size={24} />
                <span className="text-2xl font-bold text-bs-neutral-900">
                  3.8%
                </span>
              </div>
              <h3 className="text-sm text-bs-neutral-600">
                Social Engagement Rate
              </h3>
              <p className="text-xs text-bs-green mt-1">↑ 12% vs. last month</p>
            </div>

            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Repeat className="text-bs-blue" size={24} />
                <span className="text-2xl font-bold text-bs-neutral-900">
                  68%
                </span>
              </div>
              <h3 className="text-sm text-bs-neutral-600">Repeat Visit Rate</h3>
              <p className="text-xs text-bs-green mt-1">↑ 5% vs. last month</p>
            </div>
          </div>
        </section>

        {/* 2. Traffic & Conversion Funnel */}
        <section aria-labelledby="traffic-funnel">
          <h2 id="traffic-funnel" className="mb-4">
            Traffic & Conversion Funnel
          </h2>

          <SuggestionBanner
            message="Boost CTR with new Instagram Story campaign"
            actionLabel="Learn More"
            variant="warning"
          />

          <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 mt-4">
            <h3 className="mb-4">Conversion Funnel</h3>
            <FunnelChart stages={funnelStages} />
            <div className="mt-4 p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-bs-neutral-900">
                <AlertCircle size={16} className="text-bs-red" />
                <span className="font-medium">Drop-off detected:</span>
                <span>Click-to-Direction conversion is 18% below average</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Social Media Visibility */}
        <section aria-labelledby="social-visibility">
          <h2 id="social-visibility" className="mb-4">
            Social Media Visibility
          </h2>

          <SuggestionBanner
            message="Add trending keyword 'spicy noodles' to menu description"
            actionLabel="Update Now"
            onAction={() => handleQuickFix("update-keywords")}
            variant="info"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <SocialMediaCard
              platform="Google Reviews"
              icon={<Star size={24} />}
              metrics={[
                { label: "Average Rating", value: "4.6 / 5.0" },
                { label: "Total Reviews", value: 324 },
                { label: "Recent Reviews", value: "8 / week" },
              ]}
              ctaLabel="Open Reviews"
              url="https://www.google.com/maps"
              color="text-bs-gold"
            />

            <SocialMediaCard
              platform="Instagram"
              icon={<Instagram width={24} />}
              metrics={[
                { label: "Mentions", value: 145 },
                { label: "Likes", value: "2.4K" },
                { label: "Shares", value: 340 },
              ]}
              ctaLabel="Open Instagram"
              url="https://www.instagram.com"
              color="text-bs-red"
            />

            <SocialMediaCard
              platform="TikTok"
              icon={<MessageSquare size={24} />}
              metrics={[
                { label: "Video Mentions", value: 28 },
                { label: "Total Views", value: "18.5K" },
                { label: "Engagement Rate", value: "4.2%" },
              ]}
              ctaLabel="Open TikTok"
              url="https://www.tiktok.com"
              color="text-bs-blue"
            />
          </div>

          {/* Trending Keywords */}
          <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-bs-green" size={24} />
              <h3 className="font-bold text-bs-neutral-900">
                Trending Keywords
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {trendingKeywords.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-bs-green/5 border border-bs-green/20 rounded-lg"
                >
                  <div className="font-medium text-bs-neutral-900 text-sm">
                    {item.keyword}
                  </div>
                  <div className="text-xs text-bs-green mt-1">{item.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Customer Sentiment & Awareness */}
        <section aria-labelledby="sentiment-awareness">
          <h2 id="sentiment-awareness" className="mb-4">
            Customer Sentiment & Awareness
          </h2>

          <SuggestionBanner
            message="Respond to negative reviews within 24 hours"
            actionLabel="Reply Now"
            onAction={() => handleQuickFix("reply-reviews")}
            variant="warning"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Sentiment Widget */}
            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
              <h3 className="mb-4">Review Sentiment</h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      key="sentiment"
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
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
                  <div className="text-2xl font-bold text-bs-green">82%</div>
                  <div className="text-sm text-bs-neutral-600">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bs-red">18%</div>
                  <div className="text-sm text-bs-neutral-600">Negative</div>
                </div>
              </div>
            </div>

            {/* Top Complaint Themes */}
            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
              <h3 className="mb-4">Top Complaint Themes</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complaintThemes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="theme" stroke="#737373" />
                  <YAxis stroke="#737373" />
                  <Tooltip />
                  <Bar
                    key="count"
                    dataKey="count"
                    fill="#FF4C4C"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-bs-neutral-600">
                Most common issue:{" "}
                <span className="font-bold text-bs-red">
                  Wait Time (12 mentions)
                </span>
              </div>
            </div>

            {/* Brand Awareness */}
            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 lg:col-span-2">
              <h3 className="mb-4">Brand Awareness</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold text-bs-neutral-900">
                    64%
                  </div>
                  <div className="text-sm text-bs-neutral-600 mt-1">
                    of local customers recognize your brand
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-bs-green text-sm font-medium">
                    ↑ 8% vs. last quarter
                  </div>
                  <div className="text-xs text-bs-neutral-500 mt-1">
                    Target: 75% by Q3
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SEO & Long-Term Growth */}
        <section aria-labelledby="seo-growth">
          <h2 id="seo-growth" className="mb-4">
            SEO & Long-Term Growth
          </h2>

          <SuggestionBanner
            message="Post at least 3 times per week to improve ranking"
            actionLabel="Schedule Posts"
            onAction={() => handleQuickFix("post-instagram")}
            variant="info"
          />

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
                <div className="text-4xl font-bold text-bs-neutral-900">#7</div>
                <div className="text-sm text-bs-neutral-600 mt-2">
                  for "best Thai food near me"
                </div>
                <div className="text-xs text-bs-red mt-1">
                  ↓ 2 positions vs. last week
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
                  62%
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
                Avg: 2.5 posts/week (Target: 3+)
              </div>
            </div>
          </div>
        </section>

        {/* 6. Action Center (Simplified) */}
        <section aria-labelledby="action-center">
          <h2 id="action-center" className="mb-4">
            Action Center
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Smart Suggestions Panel */}
            <div className="bg-white rounded-lg border-2 border-bs-red p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-bs-red" size={24} />
                <h3 className="font-bold text-bs-neutral-900">Top 3 Issues</h3>
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

            {/* Quick Fix Buttons */}
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

            {/* AI Recommendations Card */}
            <div className="bg-bs-blue/5 border-2 border-bs-blue rounded-lg p-6">
              <h3 className="mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-bs-neutral-900 text-sm mb-1">
                    Google Reviews
                  </div>
                  <div className="text-sm text-bs-neutral-700">
                    Encourage customers to leave reviews with a QR code at
                    checkout
                  </div>
                </div>
                <div>
                  <div className="font-medium text-bs-neutral-900 text-sm mb-1">
                    Instagram
                  </div>
                  <div className="text-sm text-bs-neutral-700">
                    Post 2 TikTok videos this week to improve engagement
                  </div>
                </div>
                <div>
                  <div className="font-medium text-bs-neutral-900 text-sm mb-1">
                    TikTok
                  </div>
                  <div className="text-sm text-bs-neutral-700">
                    Share behind-the-scenes cooking content to build
                    authenticity
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Ranking Card */}
            <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
              <h3 className="mb-4">What to Do First</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
                  <span className="text-sm font-medium text-bs-neutral-900">
                    Encourage reviews
                  </span>
                  <span className="text-xs font-bold text-bs-red px-2 py-1 bg-bs-red/10 rounded-full">
                    High
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bs-gold/5 border border-bs-gold/20 rounded-lg">
                  <span className="text-sm font-medium text-bs-neutral-900">
                    Update keywords
                  </span>
                  <span className="text-xs font-bold text-bs-gold px-2 py-1 bg-bs-gold/10 rounded-full">
                    Medium
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bs-green/5 border border-bs-green/20 rounded-lg">
                  <span className="text-sm font-medium text-bs-neutral-900">
                    Post extra content
                  </span>
                  <span className="text-xs font-bold text-bs-green px-2 py-1 bg-bs-green/10 rounded-full">
                    Low
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Promotion Suggestion Cards */}
        <section aria-labelledby="promotion-suggestions">
          <h2 id="promotion-suggestions" className="mb-4">
            Promotion Suggestions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Family Dinner Friday */}
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

            {/* Spicy Noodles Trend */}
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

            {/* TikTok Challenge */}
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
          </div>
        </section>
      </div>

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-bs-neutral-200 shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3">
          <button className="flex-1 py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-bold">
            Apply Suggestions
          </button>
          <button className="flex-1 py-3 bg-bs-neutral-900 text-white rounded-lg hover:bg-bs-neutral-800 transition-colors font-bold">
            Download Report
          </button>
        </div>
      </div>

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
