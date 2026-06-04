import { useState } from "react";
import { useNavigate } from "react-router";
import { Megaphone, Plus } from "lucide-react";

import { PromotionCard } from "../components/PromotionCard";
import type { Promotion } from "../types/promotion";
import { mockPromotions } from "../data/mockPromotions";

export default function PromotionManagement() {
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);

  const deletePromotion = (promoId: string) => {
    setPromotions((prev) => prev.filter((p) => p.promoId !== promoId));
  };

  return (
    <div className="min-h-screen bg-bs-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-bs-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Megaphone className="text-bs-gold" size={28} />

                <h1 className="text-bs-neutral-900">Promotion Management</h1>
              </div>

              <p className="text-bs-neutral-600">
                Create, edit and manage your restaurant promotions and special
                offers.
              </p>
            </div>

            <button
              onClick={() => navigate("/promotion-form")}
              className="
                flex items-center gap-2
                bg-bs-gold
                text-bs-neutral-900
                px-5
                py-3
                rounded-lg
                font-medium
                hover:bg-[#FFE44D]
                transition-colors
              "
            >
              <Plus size={18} />
              Add Promotion
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {promotions.map((promotion) => (
            <PromotionCard
              key={promotion.promoId}
              promotion={promotion}
              onDelete={deletePromotion}
              onEdit={(promoId) => navigate(`/promotion/edit/${promoId}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
