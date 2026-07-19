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
import { Loader2, RefreshCw } from "lucide-react";
import {
  type FootTrafficResponse,
  type ActionSuggestionsResponse,
  FOOT_TRAFFIC_POLL_MS,
} from "../../services/visibilityApi";
import {
  buildStackedChartData,
  insightCardStyle,
  priorityBadgeClass,
  TRAFFIC_SEGMENTS,
  type TrafficSegmentKey,
} from "../../utils/trafficAnalytics";

interface TrafficTabProps {
  footTraffic: FootTrafficResponse;
  actionSuggestions: ActionSuggestionsResponse | null;
  handleViewSuggestions: () => Promise<void>;
  lastUpdatedAt?: Date | null;
  isRefreshing?: boolean;
  onRefreshLive?: () => void;
}

type Selection = {
  dayIndex: number;
  segment?: TrafficSegmentKey;
};

function formatUpdatedAt(date: Date | null | undefined) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

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

export function TrafficTab({
  footTraffic,
  handleViewSuggestions,
  lastUpdatedAt,
  isRefreshing = false,
  onRefreshLive,
}: TrafficTabProps) {
  const [selection, setSelection] = useState<Selection | null>(null);

  const stackedData = useMemo(
    () => buildStackedChartData(footTraffic.hourly ?? []),
    [footTraffic.hourly],
  );
  const insights = footTraffic.insights ?? [];
  const schedule = footTraffic.nextWeekSchedule ?? [];

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

  const updatedLabel = formatUpdatedAt(lastUpdatedAt);
  const pollMinutes = Math.round(FOOT_TRAFFIC_POLL_MS / 60000);
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
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 id="foot-traffic" className="mb-1">
            Weekdays vs Weekends Foot Traffic
          </h2>
          <p className="text-sm text-bs-neutral-500">
            Chart, insights, and schedule refresh together every {pollMinutes}{" "}
            min
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-bs-green">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bs-green opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bs-green" />
            </span>
            Live
          </span>
          {updatedLabel && (
            <span className="text-xs text-bs-neutral-500">
              Updated {updatedLabel}
            </span>
          )}
          {onRefreshLive && (
            <button
              type="button"
              onClick={onRefreshLive}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-bs-neutral-200 px-2.5 py-1.5 text-xs font-medium text-bs-neutral-700 hover:bg-bs-neutral-50 disabled:opacity-60"
            >
              {isRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
          )}
        </div>
      </div>

      {selectedDayLabel && (
        <p className="text-xs text-bs-blue mb-4">
          Highlighting <strong>{selectedDayLabel}</strong>
          {selection?.segment ? ` · ${selection.segment}` : ""} — click again to
          clear
        </p>
      )}

      <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6 mb-6 transition-opacity duration-300">
        <h3 className="font-bold text-bs-neutral-900 mb-1">
          Hourly Foot Traffic (Jun 1–7, 2026)
        </h3>
        <p className="text-xs text-bs-neutral-500 mb-4">
          Click a bar segment to link Traffic Insight cards below
          {isRefreshing ? " · refreshing…" : ""}
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
                {stackedData.map((row, index) => (
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6">
          <h3 className="font-bold text-bs-neutral-900 mb-4">
            Traffic Insight
          </h3>
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
                    <p className="text-sm text-bs-neutral-700">
                      {insight.body}
                    </p>
                  </button>
                );
              })
            )}
          </div>
          {/* <button
            onClick={handleViewSuggestions}
            className="w-full mt-4 py-2 bg-bs-blue text-white rounded-lg hover:bg-bs-blue/90 transition-colors text-sm font-medium"
          >
            View Suggestions
          </button> */}
        </div>

        <div className="bg-white rounded-xl border-2 border-bs-neutral-200 p-6">
          <h3 className="font-bold text-bs-neutral-900 mb-1">
            Recommended Shifts (Jun 8–14, 2026)
          </h3>
          <p className="text-xs text-bs-neutral-500 mb-4">
            Forecast week after chart data (Jun 1–7) — updates on each live poll
          </p>
          {schedule.length === 0 ? (
            <p className="text-sm text-bs-neutral-500">
              No shift recommendations yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-bs-neutral-500 border-b border-bs-neutral-200">
                    <th className="py-2 pr-2">Day</th>
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Shift</th>
                    <th className="py-2 pr-2">Expected</th>
                    <th className="py-2 pr-2">Staff</th>
                    <th className="py-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row, i) => {
                    const isSelected =
                      selection?.dayIndex === row.dayIndex &&
                      (!selection.segment || selection.segment === row.segment);

                    return (
                      <tr
                        key={`${row.day}-${row.shift}-${i}`}
                        className={`border-b border-bs-neutral-100 cursor-pointer hover:bg-bs-neutral-50 ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                        onClick={() =>
                          selectFromChart(
                            row.dayIndex,
                            row.segment as TrafficSegmentKey,
                          )
                        }
                      >
                        <td className="py-2 pr-2 font-medium">{row.day}</td>
                        <td className="py-2 pr-2 text-bs-neutral-500">
                          {row.date}
                        </td>
                        <td className="py-2 pr-2">{row.shift}</td>
                        <td className="py-2 pr-2">{row.expectedVisitors}</td>
                        <td className="py-2 pr-2">{row.staffSuggested}</td>
                        <td className="py-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${priorityBadgeClass(row.priority)}`}
                          >
                            {row.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
