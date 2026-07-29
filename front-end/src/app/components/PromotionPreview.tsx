// components/PromotionPreview.tsx

import type { Promotion } from "../types/promotion";
import { normalizePromotion } from "../utils/promotionUtils";

interface Props {
  promotion: Promotion;
}

const DEFAULT_PROMO_IMAGE =
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop";

export function PromotionPreview({ promotion }: Props) {
  const norm = normalizePromotion(promotion);

  return (
    <a
      href={norm.websiteUrl || "#"}
      target={norm.websiteUrl ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className="block border border-bs-neutral-200 rounded-xl p-3 mt-3 bg-white transition-all duration-200 hover:shadow-md"
    >
      <div className="w-full h-36 rounded overflow-hidden bg-bs-neutral-100 mb-2">
        <img
          src={norm.imageUrl || DEFAULT_PROMO_IMAGE}
          alt={norm.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_PROMO_IMAGE;
          }}
        />
      </div>

      <h4 className="font-semibold text-sm text-bs-neutral-900 line-clamp-1">
        {norm.title}
      </h4>

      {norm.description && (
        <p className="text-xs text-bs-neutral-600 line-clamp-2 mt-1 leading-relaxed">
          {norm.description}
        </p>
      )}

      <p className="text-[11px] font-medium text-bs-gold mt-2">
        {norm.isAllDay
          ? "Available All Day"
          : norm.startTime && norm.endTime
            ? `${norm.startTime} - ${norm.endTime}`
            : "Special Offer"}
      </p>
    </a>
  );
}

