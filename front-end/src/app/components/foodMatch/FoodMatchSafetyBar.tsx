import { Shield, Eye, EyeOff, Flag, Ban } from "lucide-react";

interface FoodMatchSafetyBarProps {
  profileVisible: boolean;
  onToggleVisibility: () => void;
  onReport: () => void;
  onBlock: () => void;
}

export function FoodMatchSafetyBar({
  profileVisible,
  onToggleVisibility,
  onReport,
  onBlock,
}: FoodMatchSafetyBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-md border border-bs-neutral-200">
      <div className="flex items-center gap-2 text-xs text-bs-neutral-600">
        <Shield className="w-4 h-4 text-bs-green shrink-0" />
        <span>Meet safely in public places.</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleVisibility}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bs-neutral-100 hover:bg-bs-neutral-200 transition-colors"
          title="Toggle profile visibility"
        >
          {profileVisible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          {profileVisible ? "Visible" : "Hidden"}
        </button>
        <button
          type="button"
          onClick={onReport}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-bs-neutral-600 hover:text-bs-red hover:bg-bs-red/10 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Report
        </button>
        <button
          type="button"
          onClick={onBlock}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-bs-neutral-600 hover:text-bs-red hover:bg-bs-red/10 transition-colors"
        >
          <Ban className="w-3.5 h-3.5" />
          Block
        </button>
      </div>
    </div>
  );
}
