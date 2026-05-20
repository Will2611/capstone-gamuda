import type { CSSProperties } from "react";

interface MapPinProps {
  type: "gold" | "red";
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export function MapPin({
  type,
  selected = false,
  onClick,
  style,
}: MapPinProps) {
  const fillColor = type === "gold" ? "#FFD700" : "#FF4C4C";
  const scale = selected ? 1.3 : 1;

  return (
    <div
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
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 0C7.163 0 0 7.163 0 16C0 28 16 40 16 40C16 40 32 28 32 16C32 7.163 24.837 0 16 0Z"
          fill={fillColor}
        />
        <circle cx="16" cy="16" r="6" fill="white" />
      </svg>
    </div>
  );
}
