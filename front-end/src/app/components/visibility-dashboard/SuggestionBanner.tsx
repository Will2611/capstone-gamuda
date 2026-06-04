import { Lightbulb, X } from "lucide-react";
import { useState } from "react";

interface SuggestionBannerProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "info" | "warning" | "success";
}

export function SuggestionBanner({
  message,
  actionLabel,
  onAction,
  variant = "info",
}: SuggestionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const variantStyles = {
    info: "bg-bs-blue/10 border-bs-blue text-bs-blue",
    warning: "bg-bs-gold/10 border-bs-gold text-bs-neutral-900",
    success: "bg-bs-green/10 border-bs-green text-bs-green",
  };

  return (
    <div
      className={`border-l-4 p-4 rounded-lg ${variantStyles[variant]} relative`}
    >
      <div className="flex items-start gap-3">
        <Lightbulb size={20} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-2 text-sm underline hover:no-underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-current opacity-50 hover:opacity-100"
          aria-label="Dismiss suggestion"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
