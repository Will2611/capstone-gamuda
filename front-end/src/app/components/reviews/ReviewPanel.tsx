import { useState, useEffect } from "react";
import { Star, Camera, Play } from "lucide-react";
import { GoogleReviews } from "./GoogleReviews";
import { InstagramPosts } from "./InstagramPosts";
import { TikTokVideos } from "./TikTokVideos";
import {
  getGoogleReviews,
  getInstagramPosts,
  getTikTokVideos,
} from "../../services/reviewsApi";

type TabType = "google" | "instagram" | "tiktok";

interface ReviewPanelProps {
  restaurantId: number;
  restaurantName: string;
}

export function ReviewPanel({
  restaurantId,
  restaurantName,
}: ReviewPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("google");
  const [loading, setLoading] = useState(true);

  // Review data states
  const [googleData, setGoogleData] = useState<{
    averageRating: number;
    totalReviews: number;
    reviewUrl: string;
  } | null>(null);

  const [instagramData, setInstagramData] = useState<{
    posts: Array<{ id: number; thumbnailUrl: string; postUrl: string }>;
    profileUrl: string;
  } | null>(null);

  const [tiktokData, setTiktokData] = useState<{
    videos: Array<{
      id: number;
      thumbnailUrl: string;
      videoUrl: string;
      duration: string;
    }>;
    profileUrl: string;
  } | null>(null);

  // Fetch review data when component mounts
  useEffect(() => {
    const fetchReviewData = async () => {
      setLoading(true);
      try {
        const [google, instagram, tiktok] = await Promise.all([
          getGoogleReviews(restaurantId),
          getInstagramPosts(restaurantId),
          getTikTokVideos(restaurantId),
        ]);

        setGoogleData(google);
        setInstagramData(instagram);
        setTiktokData(tiktok);
      } catch (error) {
        console.error("Failed to fetch review data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [restaurantId]);

  const tabs = [
    {
      id: "google" as TabType,
      label: "Google Reviews",
      icon: <Star size={20} />,
    },
    {
      id: "instagram" as TabType,
      label: "Instagram",
      icon: <Camera size={20} />,
    },
    { id: "tiktok" as TabType, label: "TikTok", icon: <Play size={20} /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-bs-neutral-200">
        <h3 className="mb-1">Reviews & Social Media</h3>
        <p className="text-sm text-bs-neutral-600">
          See what people are saying about {restaurantName}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bs-neutral-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 md:flex-none px-6 py-4 flex items-center justify-center gap-2 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-bs-gold text-bs-gold bg-bs-gold/5"
                : "border-transparent text-bs-neutral-600 hover:text-bs-neutral-900 hover:bg-bs-neutral-50"
            }`}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-bs-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-bs-neutral-600">Loading reviews...</p>
          </div>
        ) : (
          <>
            {activeTab === "google" && googleData && (
              <GoogleReviews
                averageRating={googleData.averageRating}
                totalReviews={googleData.totalReviews}
                reviewUrl={googleData.reviewUrl}
              />
            )}
            {activeTab === "instagram" && instagramData && (
              <InstagramPosts
                posts={instagramData.posts}
                profileUrl={instagramData.profileUrl}
              />
            )}
            {activeTab === "tiktok" && tiktokData && (
              <TikTokVideos
                videos={tiktokData.videos}
                profileUrl={tiktokData.profileUrl}
              />
            )}
          </>
        )}
      </div>

      {/* Privacy Note */}
      <div className="px-6 pb-6">
        <p className="text-xs text-bs-neutral-500 italic">
          Reviews link to external platforms. No personal data is stored by
          BiteScouts.
        </p>
      </div>
    </div>
  );
}
