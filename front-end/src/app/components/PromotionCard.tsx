import type { Promotion } from "../types/promotion";
import { isPromotionActive } from "../utils/promotionUtils";
import { Calendar, Clock, ExternalLink, Edit2, Trash2 } from "lucide-react";

interface PromotionCardProps {
  promotion: Promotion;
  onDelete: (promotion: Promotion) => void;
  onEdit: (promoId: string) => void;
}

export function PromotionCard({
  promotion,
  onDelete,
  onEdit,
}: PromotionCardProps) {
  const isActive = isPromotionActive(promotion);

  return (
    <div className="
      group
      flex flex-col
      bg-white/80 backdrop-blur-md
      border border-bs-neutral-200/60
      rounded-2xl
      overflow-hidden
      shadow-md hover:shadow-xl
      transition-all duration-300
      transform hover:-translate-y-1
    ">
      {/* Promotion Image & Status Badge */}
      <div className="relative w-full h-48 overflow-hidden bg-bs-neutral-100">
        <img
          src={promotion.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop"}
          alt={promotion.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback for broken image URLs
            e.currentTarget.src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop";
          }}
        />
        
        {/* Floating Active Status Badge (White background, Green/Red text) */}
        <div className={`
          absolute top-3 right-3
          flex items-center gap-1.5
          px-3 py-1.5 rounded-full
          text-xs font-bold
          bg-white shadow-md border border-bs-neutral-200
          ${isActive ? "text-emerald-600" : "text-rose-600"}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
          {isActive ? "Active" : "Expired"}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-bs-neutral-900 group-hover:text-bs-gold transition-colors duration-200">
              {promotion.title}
            </h3>
            
            {promotion.websiteUrl && (
              <a
                href={promotion.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  p-1.5
                  rounded-lg
                  text-bs-neutral-400
                  hover:text-bs-neutral-600
                  hover:bg-bs-neutral-100
                  transition-all
                "
                title="Visit Promotion Link"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          <p className="text-sm text-bs-neutral-600 mb-5 line-clamp-2 leading-relaxed">
            {promotion.description}
          </p>
        </div>

        <div>
          {/* Metadata details */}
          <div className="space-y-2.5 pt-4 border-t border-bs-neutral-100">
            <div className="flex items-center gap-2.5 text-xs text-bs-neutral-500">
              <Calendar size={14} className="text-bs-neutral-400" />
              <span>
                {promotion.startDate} to {promotion.endDate}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-bs-neutral-500">
              <Clock size={14} className="text-bs-neutral-400" />
              <span>
                {promotion.startTime && promotion.endTime && !promotion.isAllDay
                  ? `${promotion.startTime} - ${promotion.endTime}`
                  : "All Day"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={() => onEdit(promotion.promoId)}
              className="
                flex-1
                flex items-center justify-center gap-2
                py-2.5 px-4
                rounded-xl
                bg-bs-gold
                hover:bg-[#FFD600]
                text-bs-neutral-900
                font-semibold text-sm
                shadow-sm hover:shadow
                transition-all
              "
            >
              <Edit2 size={14} />
              Edit
            </button>

            <button
              onClick={() => onDelete(promotion)}
              className="
                flex items-center justify-center
                p-2.5 px-3
                rounded-xl
                bg-rose-50
                hover:bg-rose-100
                text-rose-600
                border border-rose-200/50
                transition-all
              "
              title="Delete Promotion"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
