import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  buildMonthlyDemographicsFromTraffic,
  type CustomerDemographics,
  type FootTrafficResponse,
} from "../../services/visibilityApi";

interface DemographicsTabProps {
  demographics: CustomerDemographics;
  footTraffic?: FootTrafficResponse;
}

export function DemographicsTab({
  demographics,
  footTraffic,
}: DemographicsTabProps) {
  const { display, usingTrackerData } = useMemo(() => {
    if (demographics.totalVisitors > 0) {
      return { display: demographics, usingTrackerData: true };
    }
    return {
      display: buildMonthlyDemographicsFromTraffic(footTraffic, demographics),
      usingTrackerData: false,
    };
  }, [demographics, footTraffic]);

  const ageData = display.ageGroups.map((group) => ({
    name: group.ageRange,
    value: group.count,
    fill: group.color,
  }));

  const genderData = display.genderBreakdown.map((group) => ({
    name: group.gender,
    value: group.count,
    fill: group.color,
  }));

  const subtitle = usingTrackerData
    ? "From guests who clicked Get Directions (Visit trackers, client profiles)."
    : "Estimated mix from foot-traffic totals until direction-click profiles are available.";

  const ageCaption = usingTrackerData
    ? "Unique visitors from direction clicks"
    : "Estimated from current foot traffic week";

  const snapshotCaption = usingTrackerData
    ? "Unique guests with profile who requested directions"
    : "Estimated guests across age and gender groups";

  return (
    <section aria-labelledby="customer-demographics">
      <div className="mb-6">
        <h2 id="customer-demographics" className="mb-1">
          Customer Demographics
        </h2>
        <p className="text-sm text-bs-neutral-500">{subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="bg-white rounded-2xl border border-bs-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-semibold text-bs-neutral-900">
                Age Group Breakdown
              </h3>
              <p className="text-sm text-bs-neutral-500">{ageCaption}</p>
            </div>
            <div className="rounded-2xl bg-bs-neutral-100 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-bs-neutral-500">
                Total visitors
              </p>
              <p className="mt-1 text-3xl font-semibold text-bs-neutral-900">
                {display.totalVisitors.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ageData}
                  margin={{ top: 16, right: 0, left: -12, bottom: 8 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#4B5563" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    wrapperStyle={{
                      borderRadius: 12,
                      border: "1px solid #E5E7EB",
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {ageData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {display.ageGroups.map((group) => (
                <div
                  key={group.ageRange}
                  className="rounded-2xl border border-bs-neutral-200 bg-bs-neutral-50 p-4"
                >
                  <div className="text-sm font-medium text-bs-neutral-600">
                    {group.ageRange}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-bs-neutral-900">
                    {group.count}
                  </div>
                  <div
                    className="mt-3 h-2 rounded-full"
                    style={{ background: group.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-bs-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-bs-neutral-900 mb-3">
              Gender Distribution
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {genderData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {display.genderBreakdown.map((group) => (
                <div
                  key={group.gender}
                  className="flex items-center justify-between rounded-2xl border border-bs-neutral-200 bg-bs-neutral-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full"
                      style={{ background: group.color }}
                    />
                    <span className="text-sm text-bs-neutral-700">
                      {group.gender}
                    </span>
                  </div>
                  <span className="font-semibold text-bs-neutral-900">
                    {group.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-bs-neutral-200 bg-bs-slate-50 p-6 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-bs-neutral-500">
              Visitor mix snapshot
            </p>
            <p className="mt-4 text-5xl font-bold text-bs-neutral-900">
              {display.totalVisitors.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-bs-neutral-500">{snapshotCaption}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
