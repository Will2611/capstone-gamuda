import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  getFootTraffic,
  normalizeFootTraffic,
  type FootTrafficResponse,
} from "../../services/visibilityApi";
import {
  buildStackedChartData,
  formatChartWeekRange,
  TRAFFIC_SEGMENTS,
  type TrafficSegmentKey,
} from "../../utils/trafficAnalytics";

interface TrafficTabProps {
  footTraffic: FootTrafficResponse;
}

type Selection = {
  dayIndex: number;
  segment?: TrafficSegmentKey;
};

type WeekOffset = 0 | 1;

function segmentOpacity(
  dayIndex: number,
  segmentKey: string,
  selection: Selection | null,
) {
  if (!selection) return 1;
  if (selection.dayIndex !== dayIndex) return 0.35;
  if (selection.segment && selection.segment !== segmentKey) return 0.5;
  return 1;
}

function formatWeekDelta(
  weekOffset: WeekOffset,
  weekTotal: number,
  otherWeekTotal: number | null,
): { text: string; tone: "up" | "down" | "flat" } | null {
  if (otherWeekTotal == null) return null;
  const diff = weekTotal - otherWeekTotal;
  const compareLabel = weekOffset === 0 ? "last week" : "this week";
  if (otherWeekTotal === 0 && weekTotal === 0) {
    return { text: `vs ${compareLabel} — same`, tone: "flat" };
  }
  if (otherWeekTotal === 0) {
    return {
      text: `vs ${compareLabel} ↑ new traffic (+${weekTotal} visits)`,
      tone: "up",
    };
  }
  const pct = Math.round((diff / otherWeekTotal) * 100);
  if (diff === 0) {
    return { text: `vs ${compareLabel} — same`, tone: "flat" };
  }
  if (diff > 0) {
    return {
      text: `vs ${compareLabel} ↑ ${pct}% (+${diff} visits)`,
      tone: "up",
    };
  }
  return {
    text: `vs ${compareLabel} ↓ ${Math.abs(pct)}% (${diff} visits)`,
    tone: "down",
  };
}

export function TrafficTab({ footTraffic }: TrafficTabProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [weekOffset, setWeekOffset] = useState<WeekOffset>(0);
  const [displayTraffic, setDisplayTraffic] =
    useState<FootTrafficResponse>(footTraffic);
  const [weekLoading, setWeekLoading] = useState(false);
  const [weekError, setWeekError] = useState<string | null>(null);

  const restaurantId = footTraffic.restaurantId;

  // Sync when parent reloads restaurant (this week baseline).
  useEffect(() => {
    setWeekOffset(0);
    setSelection(null);
    setDisplayTraffic(footTraffic);
    setWeekError(null);
  }, [footTraffic]);

  useEffect(() => {
    if (!restaurantId) return;
    if (weekOffset === 0) {
      setDisplayTraffic(footTraffic);
      return;
    }

    let cancelled = false;
    setWeekLoading(true);
    setWeekError(null);

    void getFootTraffic(restaurantId, weekOffset)
      .then((raw) => {
        if (cancelled) return;
        setDisplayTraffic(normalizeFootTraffic(raw, restaurantId));
        setSelection(null);
      })
      .catch(() => {
        if (cancelled) return;
        setWeekError("Could not load last week’s traffic.");
      })
      .finally(() => {
        if (!cancelled) setWeekLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, weekOffset, footTraffic]);

  const stackedData = useMemo(
    () => buildStackedChartData(displayTraffic.chartDays ?? []),
    [displayTraffic.chartDays],
  );
  const chartData = useMemo(
    () => stackedData.map((row) => ({ ...row, labelAnchor: 0.001 })),
    [stackedData],
  );
  const chartTitle = useMemo(
    () => formatChartWeekRange(displayTraffic.chartDays ?? []),
    [displayTraffic.chartDays],
  );

  const delta = useMemo(
    () =>
      formatWeekDelta(
        weekOffset,
        displayTraffic.weekTotal,
        displayTraffic.otherWeekTotal,
      ),
    [weekOffset, displayTraffic.weekTotal, displayTraffic.otherWeekTotal],
  );

  const canShowLastWeek =
    displayTraffic.hasPreviousWeek || footTraffic.hasPreviousWeek;

  const selectFromChart = (dayIndex: number, segment?: TrafficSegmentKey) => {
    setSelection((prev) => {
      if (
        prev?.dayIndex === dayIndex &&
        (!segment || prev.segment === segment)
      ) {
        return null;
      }
      return { dayIndex, segment };
    });
  };

  const selectedDayLabel =
    selection != null ? stackedData[selection.dayIndex]?.day : null;

  const renderLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (!value || height < 14) return null;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        fill="#fff"
      >
        {value}
      </text>
    );
  };

  const renderTotal = (props: any) => {
    const { x, y, width, payload, index } = props;
    const row = payload ?? chartData[index];
    if (!row || x == null || y == null || width == null) return null;
    const total = row.total;
    if (total == null || Number.isNaN(Number(total))) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#262626"
      >
        {total}
      </text>
    );
  };

  return (
    <section aria-labelledby="foot-traffic">
      <div className="mb-6">
        <h2 id="foot-traffic" className="mb-1">
          Weekdays vs Weekends Foot Traffic
        </h2>
        <p className="text-sm text-bs-neutral-500">
          Compare this week to last week to spot staffing and promo shifts.
        </p>
      </div>

      {selectedDayLabel && (
        <p className="text-xs text-bs-blue mb-4">
          Highlighting <strong>{selectedDayLabel}</strong>
          {selection?.segment ? ` · ${selection.segment}` : ""} — click again to
          clear
        </p>
      )}

      <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
          <div>
            <h3 className="font-bold text-bs-neutral-900">
              {chartTitle || "No traffic dates"}
            </h3>
            {delta && (
              <p
                className={`text-xs mt-1 font-medium ${
                  delta.tone === "up"
                    ? "text-emerald-600"
                    : delta.tone === "down"
                      ? "text-rose-600"
                      : "text-bs-neutral-500"
                }`}
              >
                {delta.text}
              </p>
            )}
            {weekError && (
              <p className="text-xs mt-1 text-rose-600">{weekError}</p>
            )}
          </div>

          <div
            className="inline-flex rounded-lg border border-bs-neutral-200 p-0.5 self-start"
            role="group"
            aria-label="Select traffic week"
          >
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                weekOffset === 0
                  ? "bg-bs-blue text-white"
                  : "text-bs-neutral-600 hover:bg-bs-neutral-50"
              }`}
            >
              This week
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(1)}
              disabled={!canShowLastWeek}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                weekOffset === 1
                  ? "bg-bs-blue text-white"
                  : "text-bs-neutral-600 hover:bg-bs-neutral-50"
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
            >
              Last week
            </button>
          </div>
        </div>

        {weekLoading && (
          <p className="text-xs text-bs-neutral-500 mb-3">Loading week…</p>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 mt-4">
          {TRAFFIC_SEGMENTS.map((s) => (
            <span
              key={s.key}
              className="flex items-center gap-1.5 text-xs text-bs-neutral-700"
            >
              <span
                className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            barCategoryGap="22%"
            margin={{ top: 40, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#E5E5E5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#525252" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Visits",
                angle: -90,
                position: "insideLeft",
                offset: 12,
                style: { fontSize: 10, fill: "#A3A3A3" },
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const segments = (payload as any[]).filter(
                  (p) =>
                    p.dataKey !== "labelAnchor" &&
                    TRAFFIC_SEGMENTS.some((seg) => seg.key === p.dataKey),
                );
                const total = segments.reduce(
                  (s: number, p: any) => s + (p.value ?? 0),
                  0,
                );
                return (
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs min-w-[160px]">
                    <p className="font-bold text-gray-800 mb-1">{label}</p>
                    {[...segments].reverse().map((p: any) => (
                      <p
                        key={p.dataKey}
                        style={{ color: p.fill }}
                        className="flex justify-between gap-4"
                      >
                        <span>{p.name}</span>
                        <span className="font-semibold">{p.value}</span>
                      </p>
                    ))}
                    <p className="border-t border-gray-100 mt-1 pt-1 font-bold text-gray-800 flex justify-between">
                      <span>Total</span>
                      <span>{total}</span>
                    </p>
                  </div>
                );
              }}
            />

            {TRAFFIC_SEGMENTS.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="stack"
                fill={s.color}
                name={s.label}
                onClick={(barData) => {
                  const dayIndex = barData?.payload?.dayIndex;
                  if (typeof dayIndex === "number") {
                    selectFromChart(dayIndex, s.key);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {stackedData.map((row) => (
                  <Cell
                    key={`${s.key}-${row.dayIndex}`}
                    fill={s.color}
                    fillOpacity={segmentOpacity(row.dayIndex, s.key, selection)}
                    stroke={
                      selection?.dayIndex === row.dayIndex &&
                      (!selection.segment || selection.segment === s.key)
                        ? "#1D4ED8"
                        : undefined
                    }
                    strokeWidth={
                      selection?.dayIndex === row.dayIndex &&
                      (!selection.segment || selection.segment === s.key)
                        ? 2
                        : 0
                    }
                  />
                ))}
                <LabelList dataKey={s.key} content={renderLabel} />
              </Bar>
            ))}
            <Bar
              dataKey="labelAnchor"
              stackId="stack"
              fill="transparent"
              stroke="none"
              legendType="none"
              isAnimationActive={false}
              name=""
              radius={[4, 4, 0, 0]}
            >
              <LabelList dataKey="total" position="top" content={renderTotal} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
