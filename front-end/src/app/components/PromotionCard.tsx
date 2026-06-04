import type { Promotion } from "../types/promotion";
import { isPromotionActive } from "../utils/promotionUtils";

interface PromotionCardProps {
  promotion: Promotion;
  onDelete: (id: string) => void;
  onEdit: (promoId: string) => void;
}

export function PromotionCard({
  promotion,
  onDelete,
  onEdit,
}: PromotionCardProps) {
  const isActive = isPromotionActive(promotion);

  return (
    <div className="border rounded-xl p-4 shadow-sm">
      <img
        src={promotion.imageUrl}
        alt={promotion.title}
        className="w-full h-48 object-cover rounded-lg mb-4"
      />

      <h3 className="font-bold text-lg">{promotion.title}</h3>

      <p className="text-sm text-gray-600 mb-4">{promotion.description}</p>

      <div className="space-y-1 text-sm">
        <p>
          Date:
          <span className="font-medium">
            {" "}
            {promotion.startDate} - {promotion.endDate}
          </span>
        </p>

        <p>
          Time:
          <span className="font-medium">
            {" "}
            {promotion.startTime && promotion.endTime
              ? `${promotion.startTime} - ${promotion.endTime}`
              : "All Day"}
          </span>
        </p>

        <p>
          Status:{" "}
          <span
            className={
              isActive
                ? "text-green-600 font-semibold"
                : "text-red-600 font-semibold"
            }
          >
            {isActive ? "Available" : "Not Available"}
          </span>
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEdit(promotion.promoId)}
          className="
      flex-1
    py-2
    rounded-lg
    bg-bs-gold
    border-2
    border-bs-gold
    text-bs-neutral-900
    hover:brightness-105
    transition-all
    "
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(promotion.promoId)}
          className="
      flex-1
      py-2
      rounded-lg
      bg-bs-red
      text-white
      hover:bg-bs-red/90
      transition-colors
    "
        >
          Delete
        </button>
      </div>
    </div>
  );
}
