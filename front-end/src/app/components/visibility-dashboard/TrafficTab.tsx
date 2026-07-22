import { useMemo, useState } from "react";
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
import { type FootTrafficResponse } from "../../services/visibilityApi";
import {
  buildStackedChartData,
  formatChartWeekRange,
  insightCardStyle,
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

export function TrafficTab({ footTraffic }: TrafficTabProps) {
  const [selection, setSelection] = useState<Selection | null>(null);

  const stackedData = useMemo(
    () => buildStackedChartData(footTraffic.chartDays ?? []),
    [footTraffic.chartDays],
  );
  const insights = footTraffic.insights ?? [];
  const chartTitle = useMemo(
    () => formatChartWeekRange(footTraffic.chartDays ?? []),
    [footTraffic.chartDays],
  );

  const selectFromInsight = (
    dayIndex: number | null | undefined,
    segment?: string | null,
  ) => {
    if (dayIndex == null || Number.isNaN(dayIndex)) {
      setSelection(null);
      return;
    }
    setSelection({
      dayIndex,
      segment: (segment as TrafficSegmentKey | undefined) ?? undefined,
    });
  };

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
    const { x, y, width, value } = props;
    if (!value) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill="#262626"
      >
        {value}
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
          Historical visitor counts from foot traffic hourly data (PostgreSQL)
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
        <h3 className="font-bold text-bs-neutral-900 mb-1">{chartTitle}</h3>
        <p className="text-xs text-bs-neutral-500 mb-4">
          Daily totals per traffic date — matches pgAdmin foot_traffic_hourly
        </p>

        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
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
            data={stackedData}
            barCategoryGap="22%"
            margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
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
                const total = (payload as any[]).reduce(
                  (s: number, p: any) => s + (p.value ?? 0),
                  0,
                );
                return (
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs min-w-[160px]">
                    <p className="font-bold text-gray-800 mb-1">{label}</p>
                    {[...(payload as any[])].reverse().map((p: any) => (
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

            {TRAFFIC_SEGMENTS.map((s, si) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="stack"
                fill={s.color}
                name={s.label}
                radius={
                  si === TRAFFIC_SEGMENTS.length - 1
                    ? [4, 4, 0, 0]
                    : [0, 0, 0, 0]
                }
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
                {si === TRAFFIC_SEGMENTS.length - 1 && (
                  <LabelList
                    dataKey="total"
                    position="top"
                    content={renderTotal}
                  />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6">
        <h3 className="font-bold text-bs-neutral-900 mb-4">Traffic Insight</h3>
        <div className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-sm text-bs-neutral-500">
              Insights will appear when foot traffic data is available.
            </p>
          ) : (
            insights.map((insight) => {
              const style = insightCardStyle(insight.type);
              const isSelected =
                selection != null &&
                insight.linkedDayIndex === selection.dayIndex &&
                (!insight.linkedSegment ||
                  !selection.segment ||
                  insight.linkedSegment === selection.segment);

              return (
                <button
                  key={insight.id}
                  type="button"
                  onClick={() =>
                    selectFromInsight(
                      insight.linkedDayIndex,
                      insight.linkedSegment,
                    )
                  }
                  className={`w-full text-left p-3 rounded-lg border transition-all ${style.border} ${
                    isSelected ? "ring-2 ring-bs-blue shadow-sm" : ""
                  }`}
                  style={{ background: style.background }}
                >
                  <p className={`text-xs font-bold mb-1 ${style.title}`}>
                    {insight.title}
                  </p>
                  <p className="text-sm text-bs-neutral-700">{insight.body}</p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
