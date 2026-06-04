// components/PromotionPreview.tsx

import type { Promotion } from "../types/promotion";

interface Props {
  promotion: Promotion;
}

export function PromotionPreview({ promotion }: Props) {
  return (
    <a
      href={promotion.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="
    block
    border
    border-bs-neutral-200
    rounded-xl
    p-3
    mt-3

    transition-all
    duration-200

    hover:shadow-md
  "
    >
      <img
        src={promotion.imageUrl}
        alt={promotion.title}
        className="
          w-full
          h-40
          object-cover
          rounded
        "
      />

      <h4 className="font-semibold mt-2">{promotion.title}</h4>

      <p className="text-sm text-gray-600">{promotion.description}</p>

      <p className="text-xs text-bs-neutral-500 mt-2">
        {promotion.isAllDay
          ? "Available All Day"
          : `${promotion.startTime} - ${promotion.endTime}`}
      </p>
    </a>
  );
}
