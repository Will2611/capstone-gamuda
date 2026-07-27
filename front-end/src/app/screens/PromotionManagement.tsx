import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Megaphone,
  Plus,
  Search,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

import { PromotionCard } from "../components/PromotionCard";
import type { Promotion } from "../types/promotion";
import { isPromotionActive } from "../utils/promotionUtils";

export default function PromotionManagement() {
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "expired">(
    "all"
  );
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch promotions from database on mount
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("bitescouts_token");

      const response = await fetch("http://localhost:8000/promotions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch promotions");
      }

      setPromotions(data);
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err.message || "Something went wrong while fetching promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!promoToDelete) return;
    const targetId = promoToDelete.id || promoToDelete.promoId;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("bitescouts_token");

      const response = await fetch(
        `http://localhost:8000/promotions/${targetId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete promotion");
      }

      // Update local state upon successful removal from DB
      setPromotions((prev) =>
        prev.filter((p) => p.id !== targetId && p.promoId !== targetId)
      );
      setPromoToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete promotion:", err);
      alert(err.message || "Failed to delete promotion");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper check for active state (must not be draft and must meet date criteria)
  const checkIsActive = (promo: Promotion) => {
    if (promo.status === "draft") return false;
    return isPromotionActive(promo);
  };

  // Calculations for stats
  const totalCount = promotions.length;
  const activeCount = promotions.filter(checkIsActive).length;
  const draftCount = promotions.filter((p) => p.status === "draft").length;
  const expiredCount = promotions.filter(
    (p) => p.status !== "draft" && !isPromotionActive(p)
  ).length;

  // Filtered promotions based on query and tab
  const filteredPromotions = promotions.filter((promo) => {
    const isActive = checkIsActive(promo);
    const isDraft = promo.status === "draft";
    const isExpired = !isDraft && !isActive;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && isActive) ||
      (activeTab === "draft" && isDraft) ||
      (activeTab === "expired" && isExpired);

    const matchesSearch =
      promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
  };

  return (
    <div className="min-h-screen bg-bs-neutral-100/60 pb-16">
      {/* Header with Stats Dashboard */}
      <div className="bg-gradient-to-br from-[#FFFCEB] via-white to-[#FFFDF0] border-b border-bs-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3.5 mb-2">
                <div className="p-2.5 bg-bs-gold/15 rounded-xl text-bs-gold border border-bs-gold/25 shadow-sm">
                  <Megaphone size={26} />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-bs-neutral-900">
                  Promotion Management
                </h1>
              </div>
              <p className="text-bs-neutral-600 text-sm md:text-base max-w-xl leading-relaxed">
                Create, customize, and coordinate your restaurant's special
                offers. Boost visibility on client search maps and attract new
                diners.
              </p>
            </div>

            <button
              onClick={() => navigate("/promotion-form")}
              className="
                self-start lg:self-center
                flex items-center gap-2.5
                bg-bs-gold
                hover:bg-[#FFD600]
                text-bs-neutral-900
                font-bold text-sm
                px-5 py-3.5
                rounded-xl
                shadow-md hover:shadow-lg
                transition-all duration-200
                transform active:scale-[0.98]
                border border-bs-gold/20
              "
            >
              <Plus size={18} />
              Add Promotion
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
            {/* Total */}
            <div className="bg-white border border-bs-neutral-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <span className="text-xs font-semibold text-bs-neutral-500 uppercase tracking-wider block mb-1">
                  Total Offers
                </span>
                <span className="text-3xl font-black text-bs-neutral-900">
                  {totalCount}
                </span>
              </div>
              <div className="p-2.5 bg-bs-neutral-100 rounded-xl text-bs-neutral-500">
                <Sparkles size={20} />
              </div>
            </div>

            {/* Active */}
            <div className="bg-white border border-bs-neutral-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <span className="text-xs font-semibold text-bs-neutral-500 uppercase tracking-wider block mb-1">
                  Active Now
                </span>
                <span className="text-3xl font-black text-emerald-600">
                  {activeCount}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-500">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            {/* Expired / Scheduled */}
            <div className="bg-white border border-bs-neutral-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <span className="text-xs font-semibold text-bs-neutral-500 uppercase tracking-wider block mb-1">
                  Expired / Inactive
                </span>
                <span className="text-3xl font-black text-rose-500">
                  {expiredCount}
                </span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
                <AlertCircle size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Controls */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          {/* Tab buttons */}
          <div className="flex bg-bs-neutral-200/50 p-1.5 rounded-xl border border-bs-neutral-200/60 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`
                flex-1 md:flex-none
                px-4 py-2 rounded-lg text-xs font-bold transition-all
                ${activeTab === "all"
                  ? "bg-white text-bs-neutral-900 shadow-sm"
                  : "text-bs-neutral-600 hover:text-bs-neutral-900"
                }
              `}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`
                flex-1 md:flex-none
                px-4 py-2 rounded-lg text-xs font-bold transition-all
                ${activeTab === "active"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-bs-neutral-600 hover:text-bs-neutral-900"
                }
              `}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`
                flex-1 md:flex-none
                px-4 py-2 rounded-lg text-xs font-bold transition-all
                ${activeTab === "draft"
                  ? "bg-white text-amber-600 shadow-sm"
                  : "text-bs-neutral-600 hover:text-bs-neutral-900"
                }
              `}
            >
              Drafts ({draftCount})
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={`
                flex-1 md:flex-none
                px-4 py-2 rounded-lg text-xs font-bold transition-all
                ${activeTab === "expired"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-bs-neutral-600 hover:text-bs-neutral-900"
                }
              `}
            >
              Expired ({expiredCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bs-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search promotions..."
              className="
                w-full
                bg-white
                border border-bs-neutral-300
                hover:border-bs-neutral-400
                focus:border-bs-gold
                focus:ring-2 focus:ring-bs-gold/15
                rounded-xl
                py-2.5 pl-10 pr-10
                text-sm text-bs-neutral-800
                placeholder:text-bs-neutral-400
                outline-none
                transition-all
              "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-bs-neutral-100 text-bs-neutral-400 hover:text-bs-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-bs-gold mb-3" size={32} />
            <p className="text-sm text-bs-neutral-500 font-medium">
              Loading promotions...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center max-w-lg mx-auto my-10">
            <AlertCircle size={32} className="mx-auto mb-2 text-rose-500" />
            <h3 className="font-bold text-lg mb-1">
              Failed to load promotions
            </h3>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={fetchPromotions}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Promotions Display Grid */}
        {!loading && !error && filteredPromotions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredPromotions.map((promotion) => (
              <PromotionCard
                key={promotion.id || promotion.promoId}
                promotion={promotion}
                onDelete={(promo) => setPromoToDelete(promo)}
                onEdit={(id) => navigate(`/promotion/edit/${id}`)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPromotions.length === 0 && (
          <div
            className="
            text-center
            max-w-md mx-auto
            py-14 px-6
            bg-white
            border border-bs-neutral-200/80
            rounded-2xl
            shadow-sm
            my-10
          "
          >
            <div
              className="
              p-4.5
              bg-bs-gold/10
              rounded-full
              inline-block
              text-bs-gold
              mb-4
            "
            >
              <Megaphone size={36} />
            </div>

            <h3 className="text-lg font-bold text-bs-neutral-900 mb-1.5">
              No promotions found
            </h3>

            <p className="text-sm text-bs-neutral-500 mb-6 leading-relaxed">
              We couldn't find any promotions matching your current search or
              tab filters.
            </p>

            <div className="flex justify-center gap-3">
              {(searchQuery || activeTab !== "all") && (
                <button
                  onClick={clearFilters}
                  className="
                    px-4 py-2.5
                    rounded-lg
                    border border-bs-neutral-300
                    text-bs-neutral-700
                    font-semibold text-xs
                    hover:bg-bs-neutral-50
                    transition-colors
                  "
                >
                  Clear Filters
                </button>
              )}

              <button
                onClick={() => navigate("/promotion-form")}
                className="
                  px-4 py-2.5
                  rounded-lg
                  bg-bs-gold
                  hover:bg-[#FFD600]
                  text-bs-neutral-900
                  font-bold text-xs
                  shadow-sm
                  transition-colors
                "
              >
                Create Offer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {promoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-bs-neutral-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-bs-neutral-900">
                Delete Promotion
              </h3>
            </div>

            <p className="text-sm text-bs-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-bs-neutral-900">
                "{promoToDelete.title}"
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setPromoToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-bs-neutral-300 text-bs-neutral-700 font-semibold text-xs hover:bg-bs-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}