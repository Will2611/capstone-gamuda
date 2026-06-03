import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

interface SocialMediaCardProps {
  platform: string;
  icon: ReactNode;
  metrics: {
    label: string;
    value: string | number;
  }[];
  ctaLabel: string;
  url: string;
  color: string;
}

export function SocialMediaCard({
  platform,
  icon,
  metrics,
  ctaLabel,
  url,
  color,
}: SocialMediaCardProps) {
  const handleOpen = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={color}>{icon}</div>
        <h3 className="font-bold text-bs-neutral-900">{platform}</h3>
      </div>

      <div className="space-y-3 mb-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-bs-neutral-600">{metric.label}</span>
            <span className="font-bold text-bs-neutral-900">
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleOpen}
        className="w-full py-2 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors flex items-center justify-center gap-2 font-medium"
        aria-label={`Open ${platform}`}
      >
        <ExternalLink size={16} />
        {ctaLabel}
      </button>
    </div>
  );
}
