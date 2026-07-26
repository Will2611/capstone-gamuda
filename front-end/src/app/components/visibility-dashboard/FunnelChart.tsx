import { AlertTriangle, Lightbulb } from "lucide-react";

interface FunnelStage {
  name: string;
  count: number;
  conversion: number;
  isDropOff?: boolean;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

const STAGE_LABELS: Record<string, string> = {
  Impressions: "Saw restaurant",
  Clicks: "Opened details",
  "Click-to-Direction": "Got directions",
  Visits: "Visited",
  Reviews: "Left a review",
};

function friendlyLabel(name: string): string {
  return STAGE_LABELS[name] ?? name;
}

function buildInsight(stages: FunnelStage[]): {
  title: string;
  body: string;
  stageName: string;
} | null {
  if (stages.length < 2) return null;

  const candidates = stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ index }) => index > 0);

  if (candidates.length === 0) return null;

  const flagged = candidates.find(({ stage }) => stage.isDropOff);
  const weakest =
    flagged ??
    candidates.reduce((worst, curr) =>
      (curr.stage.conversion ?? 100) < (worst.stage.conversion ?? 100)
        ? curr
        : worst,
    );

  const { stage, index } = weakest;
  const prev = stages[index - 1];
  const conversion = Number.isFinite(stage.conversion) ? stage.conversion : 0;
  const lost = Math.max(0, (prev?.count ?? 0) - (stage.count ?? 0));

  return {
    stageName: stage.name,
    title: `Biggest drop-off: ${friendlyLabel(prev.name)} → ${friendlyLabel(stage.name)}`,
    body: `Only ${conversion}% continue to this step (${lost.toLocaleString()} people drop off). Focus here to improve conversion.`,
  };
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

  const maxCount = Math.max(safeStages[0]?.count || 1, 1);
  const insight = buildInsight(safeStages);

  return (
    <div className="space-y-6">
      <p className="text-sm text-bs-neutral-600">
        How diners move from discovery → action
      </p>

      <div className="space-y-1.5 max-w-xl mx-auto">
        {safeStages.map((stage, index) => {
          const count = Number.isFinite(stage.count) ? stage.count : 0;
          const conversion = Number.isFinite(stage.conversion)
            ? stage.conversion
            : 0;
          const topPct = Math.max(28, Math.min(100, (count / maxCount) * 100));
          const nextCount =
            index < safeStages.length - 1
              ? Number.isFinite(safeStages[index + 1].count)
                ? safeStages[index + 1].count
                : count * 0.75
              : count * 0.82;
          const bottomPct = Math.max(
            22,
            Math.min(100, (nextCount / maxCount) * 100),
          );
          const topInset = (100 - topPct) / 2;
          const bottomInset = (100 - bottomPct) / 2;
          const isWeak =
            Boolean(stage.isDropOff) ||
            (insight?.stageName === stage.name && index > 0);
          const isLowConversion = conversion < 50 && index > 0;

          return (
            <div key={`${stage.name}-${index}`} className="relative">
              <div
                className={`relative h-14 flex items-center justify-center text-center transition-colors ${
                  isWeak
                    ? "bg-gradient-to-b from-bs-red to-bs-red/70 text-black"
                    : "bg-gradient-to-b from-bs-gold to-bs-gold/70 text-bs-neutral-900"
                }`}
                style={{
                  clipPath: `polygon(${topInset}% 0%, ${100 - topInset}% 0%, ${100 - bottomInset}% 100%, ${bottomInset}% 100%)`,
                }}
              >
                <div className="px-4 leading-tight">
                  <div className="text-xs sm:text-sm font-bold">
                    {friendlyLabel(stage.name)}
                  </div>
                  <div className="text-[11px] sm:text-xs opacity-90">
                    {count.toLocaleString()}
                    {index > 0 && (
                      <span
                        className={`ml-2 font-semibold ${
                          isLowConversion ? "text-black" : ""
                        }`}
                      >
                        · {conversion}% continue
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {index < safeStages.length - 1 && (
                <div className="flex justify-center -my-0.5 relative z-10">
                  <span className="text-bs-neutral-400 text-xs leading-none">
                    ↓
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-bs-neutral-600 justify-center">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-bs-gold" /> Healthy step
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-bs-red" /> Biggest drop-off
        </span>
      </div>

      {insight && (
        <div className="p-4 bg-bs-red/5 border border-bs-red/20 rounded-lg">
          <div className="flex items-start gap-2.5">
            <Lightbulb
              size={18}
              className="text-bs-red shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="text-sm text-bs-neutral-900">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-bs-red shrink-0" />
                {insight.title}
              </div>
              <p className="mt-1 text-bs-neutral-700">{insight.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
