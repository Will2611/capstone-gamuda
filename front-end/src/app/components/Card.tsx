import type { ReactNode } from "react";
import { Heart, Star } from "lucide-react";
import ThreeDots from "@/assets/three-dots.svg?react";

const ICON_SIZE = 16;
const STAR_FILL = "#FFD700";
const strokeWidth = 1.5;

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: CardProps) {
  const baseStyles =
    "bg-white rounded-lg p-6 border border-bs-neutral-200 transition-all duration-200";
  const hoverStyles = hover
    ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    : "shadow-md";

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface RestaurantCardProps {
  name: string;
  rating: number;
  distance: string;
  dietary: string;
  image?: string;
  onDirections?: () => void;
}

export function RestaurantCard({
  name,
  rating,
  distance,
  dietary,
  image,
  onDirections,
}: RestaurantCardProps) {
  return (
    <Card hover className="overflow-hidden p-0">
      {image && (
        <div className="h-48 bg-bs-neutral-200 overflow-hidden">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <h3 className="mb-3">{name}</h3>
        <div className="flex items-center gap-4 mb-4 text-sm text-bs-neutral-600">
          <div className="flex items-center gap-1">
            <Star
              size={ICON_SIZE}
              fill={STAR_FILL}
              stroke={STAR_FILL}
              strokeWidth={strokeWidth}
            />
            <span>{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={ICON_SIZE} strokeWidth={strokeWidth} />
            <span>{distance}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThreeDots width={16} />
            <span>{dietary}</span>
          </div>
        </div>
        {onDirections && (
          <button
            onClick={onDirections}
            className="w-full bg-bs-gold text-bs-neutral-900 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors"
          >
            Get Directions
          </button>
        )}
      </div>
    </Card>
  );
}

interface SuggestionCardProps {
  summary: string;
  rating: number;
  distance: string;
  dietary: string;
  onViewMap?: () => void;
}

export function SuggestionCard({
  summary,
  rating,
  distance,
  dietary,
  onViewMap,
}: SuggestionCardProps) {
  return (
    <Card hover>
      <p className="mb-4 text-bs-neutral-700">{summary}</p>
      <div className="flex items-center gap-4 mb-4 text-sm text-bs-neutral-600">
        <div className="flex items-center gap-1">
          <Star
            size={ICON_SIZE}
            fill={STAR_FILL}
            stroke={STAR_FILL}
            strokeWidth={strokeWidth}
          />
          <span>{rating}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart size={ICON_SIZE} strokeWidth={strokeWidth} />
          <span>{distance}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThreeDots width={16} />
          <span>{dietary}</span>
        </div>
      </div>
      {onViewMap && (
        <button
          onClick={onViewMap}
          className="w-full bg-bs-gold text-bs-neutral-900 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors"
        >
          View on Map
        </button>
      )}
    </Card>
  );
}
