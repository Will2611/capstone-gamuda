import { useState } from "react";
import { useNavigate } from "react-router";
import { Megaphone, Plus, Search, Sparkles, AlertCircle, X } from "lucide-react";

import { PromotionCard } from "../components/PromotionCard";
import type { Promotion } from "../types/promotion";
import { mockPromotions } from "../data/mockPromotions";
import { isPromotionActive } from "../utils/promotionUtils";

export default function PromotionManagement() {
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "expired">("all");

  const deletePromotion = (promoId: string) => {
    // Delete from local state
    setPromotions((prev) => prev.filter((p) => p.promoId !== promoId));
    // Persist local deletion in-memory on mockPromotions
    const idx = mockPromotions.findIndex((p) => p.promoId === promoId);
    if (idx !== -1) {
      mockPromotions.splice(idx, 1);
    }
  };

  // Calculations for stats
  const totalCount = promotions.length;
  const activeCount = promotions.filter(isPromotionActive).length;
  const expiredCount = totalCount - activeCount;

  // Filtered promotions based on query and tab
  const filteredPromotions = promotions.filter((promo) => {
    const isActive = isPromotionActive(promo);
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && isActive) ||
      (activeTab === "expired" && !isActive);

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
      
      {/* Premium Header with Stats Dashboard */}
      <div className="bg-gradient-to-br from-bs-neutral-900 via-bs-neutral-950 to-bs-neutral-900 border-b border-bs-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3.5 mb-2">
                <div className="p-2.5 bg-bs-gold/10 rounded-xl text-bs-gold border border-bs-gold/20 shadow-lg">
                  <Megaphone size={26} />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Promotion Management
                </h1>
              </div>
              <p className="text-bs-neutral-400 text-sm md:text-base max-w-xl">
                Create, customize, and coordinate your restaurant's special offers. Boost visibility on client search maps and attract new diners.
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
                shadow-lg hover:shadow-xl
                transition-all duration-200
                transform active:scale-[0.98]
              "
            >
              <Plus size={18} />
              Add Promotion
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
            {/* Total */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-bs-neutral-400 uppercase tracking-wider block mb-1">
                  Total Offers
                </span>
                <span className="text-3xl font-black text-white">{totalCount}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-xl text-white/80">
                <Sparkles size={20} />
              </div>
            </div>

            {/* Active */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Active Now
                </span>
                <span className="text-3xl font-black text-emerald-400">{activeCount}</span>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            {/* Expired */}
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                  Expired / Scheduled
                </span>
                <span className="text-3xl font-black text-rose-400">{expiredCount}</span>
              </div>
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                <AlertCircle size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content controls */}
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
                  : "text-bs-neutral-600 hover:text-bs-neutral-900"}
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
                  : "text-bs-neutral-600 hover:text-bs-neutral-900"}
              `}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={`
                flex-1 md:flex-none
                px-4 py-2 rounded-lg text-xs font-bold transition-all
                ${activeTab === "expired" 
                  ? "bg-white text-rose-600 shadow-sm" 
                  : "text-bs-neutral-600 hover:text-bs-neutral-900"}
              `}
            >
              Expired ({expiredCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bs-neutral-400" size={16} />
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

        {/* Promotions Display Grid */}
        {filteredPromotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredPromotions.map((promotion) => (
              <PromotionCard
                key={promotion.promoId}
                promotion={promotion}
                onDelete={deletePromotion}
                onEdit={(promoId) => navigate(`/promotion/edit/${promoId}`)}
              />
            ))}
          </div>
        ) : (
          /* Empty state block */
          <div className="
            text-center
            max-w-md mx-auto
            py-14 px-6
            bg-white
            border border-bs-neutral-200/80
            rounded-2xl
            shadow-sm
            my-10
          ">
            <div className="
              p-4.5
              bg-bs-gold/10
              rounded-full
              inline-block
              text-bs-gold
              mb-4
            ">
              <Megaphone size={36} />
            </div>
            
            <h3 className="text-lg font-bold text-bs-neutral-900 mb-1.5">
              No promotions found
            </h3>
            
            <p className="text-sm text-bs-neutral-500 mb-6 leading-relaxed">
              We couldn't find any promotions matching your current search or tab filters. Try modifying your criteria!
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
    </div>
  );
}
