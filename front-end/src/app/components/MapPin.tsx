import type { CSSProperties } from "react";
import MapPinColored from "/map-pin-coloured.svg?react";
import { AlertCircle } from "lucide-react";

interface MapPinProps {
  type: "gold" | "red";
  selected?: boolean;
  onClick?: () => void;
  hasPromotion?: boolean;
  style?: CSSProperties;
}

export function MapPinButton({
  type,
  selected = false,
  onClick,
  hasPromotion,
  style,
}: MapPinProps) {
  const fillColor = type === "gold" ? "#FFD700" : "#FF4C4C";
  const scale = selected ? 1.3 : 1;

  return (
    <button
      onClick={onClick}
      style={{
        ...style,
        cursor: "pointer",
        transform: `scale(${scale})`,
        transition: "transform 0.2s ease",
        filter: selected
          ? "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
          : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
      }}
      className="hover:scale-125 transition-transform"
    >
      <MapPinColored customfill={fillColor} />
      {hasPromotion && (
        <div className="absolute -top-1 -right-1">
          <AlertCircle size={20} className="fill-bs-red text-bs-red" />
          <span
            className="
      absolute inset-0
      flex items-center justify-center
      text-white text-xs font-bold
    "
          >
            !
          </span>
        </div>
      )}
    </button>
  );
}
