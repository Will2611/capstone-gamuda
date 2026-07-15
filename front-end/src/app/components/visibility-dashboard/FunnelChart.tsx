import { AlertTriangle } from 'lucide-react';

interface FunnelStage {
  name: string;
  count: number;
  conversion: number;
  isDropOff?: boolean;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const safeStages = Array.isArray(stages) ? stages : [];

  if (safeStages.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-bs-neutral-500">
        No funnel data available
      </div>
    );
  }

  const maxCount = safeStages[0]?.count || 1;

  return (
    <div className="space-y-3">
      {safeStages.map((stage, index) => {
        const count = Number.isFinite(stage.count) ? stage.count : 0;
        const conversion = Number.isFinite(stage.conversion)
          ? stage.conversion
          : 0;
        const widthPercent = (count / maxCount) * 100;
        const isLowConversion = conversion < 50 && index > 0;

        return (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-bs-neutral-700">{stage.name}</span>
                {stage.isDropOff && (
                  <AlertTriangle size={16} className="text-bs-red" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-bs-neutral-900">
                  {count.toLocaleString()}
                </span>
                {index > 0 && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isLowConversion
                        ? 'bg-bs-red/10 text-bs-red'
                        : 'bg-bs-green/10 text-bs-green'
                    }`}
                  >
                    {conversion}%
                  </span>
                )}
              </div>
            </div>

            <div className="relative h-10 bg-bs-neutral-100 rounded-lg overflow-hidden">
              <div
                className={`h-full flex items-center justify-end px-3 transition-all ${
                  stage.isDropOff
                    ? 'bg-gradient-to-r from-bs-red to-bs-red/60'
                    : 'bg-gradient-to-r from-bs-gold to-bs-gold/60'
                }`}
                style={{ width: `${Math.max(0, widthPercent)}%` }}
              >
                {widthPercent > 15 && (
                  <span className="text-xs font-bold text-bs-neutral-900">
                    {((count / maxCount) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {index < safeStages.length - 1 && (
              <div className="flex justify-center my-1">
                <svg width="20" height="12" className="text-bs-neutral-400">
                  <path d="M10 0 L10 12 M5 8 L10 12 L15 8" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
