import { useState, useEffect, useMemo } from "react";
import {
  Star,
  Navigation,
  Smile,
  Users,
  DollarSign,
  TrendingUp,
  Trophy,
  TrendingDown,
  X,
  Utensils,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  type SummaryMetrics,
  type FunnelStage,
  type Sentiment,
  type FootTrafficResponse,
} from "../../services/visibilityApi";

interface MetricsTabProps {
  summary: SummaryMetrics;
  funnel: FunnelStage[];
  sentiment: Sentiment;
  footTraffic: FootTrafficResponse;
}

interface FoodItem {
  name: string;
  sales: number;
}

interface FinancialItem {
  month_year: string;
  total_revenue: number;
  cogs: number;
  operating_expenses: number;
  net_profit: number;
  profit_margin: number;
  total_customers: number;
  aov: number;
}

function directionConversionPct(funnel: FunnelStage[]): number {
  const stages = Array.isArray(funnel) ? funnel : [];
  const clicks = stages.find((s) => s.name === "Clicks");
  const directions = stages.find((s) => s.name === "Click-to-Direction");

  const clickCount = Number(clicks?.count) || 0;
  const directionCount = Number(directions?.count) || 0;

  if (clickCount <= 0) {
    const stored = Number(directions?.conversion);
    return Number.isFinite(stored) ? Math.max(0, stored) : 0;
  }

  return Math.round((directionCount / clickCount) * 1000) / 10;
}

function weeklyVisitors(footTraffic: FootTrafficResponse): number {
  const days = footTraffic?.chartDays;
  if (!Array.isArray(days) || days.length === 0) return 0;
  return days.reduce((sum, d) => sum + (Number(d?.total) || 0), 0);
}

export function MetricsTab({
  summary,
  funnel,
  sentiment,
  footTraffic,
}: MetricsTabProps) {
  const rating = Number(summary?.averageRating?.value) || 0;
  const totalReviews = Number(summary?.averageRating?.totalReviews) || 0;
  const source = summary?.averageRating?.source || "Google";

  const conversion = directionConversionPct(funnel);
  const positivePct = Number(sentiment?.positivePct);
  const safePositive = Number.isFinite(positivePct) ? positivePct : 0;
  const visitors = weeklyVisitors(footTraffic);
  const dayCount = Array.isArray(footTraffic?.chartDays)
    ? footTraffic.chartDays.length
    : 0;

  // --- Financial & Food Data States ---
  const [financials, setFinancials] = useState<FinancialItem[]>([]);
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [top3Food, setTop3Food] = useState<FoodItem[]>([]);
  const [least3Food, setLeast3Food] = useState<FoodItem[]>([]);

  // 弹窗状态 (Modal State)
  const [activeModal, setActiveModal] = useState<
    "top3" | "least3" | "aov" | "profit" | null
  >(null);

  // 从后台获取数据
  useEffect(() => {
    async function fetchSheetAnalytics() {
      try {
        const response = await fetch(
          "http://localhost:8000/analytics/dashboard-data",
        );
        if (!response.ok) return;

        const data = await response.json();
        if (data.step1_data) {
          // Food data
          const rawItems = data.step1_data.menu_items || [];
          const sorted = [...rawItems].sort(
            (a: any, b: any) => (b.units_sold || 0) - (a.units_sold || 0),
          );

          setTop3Food(
            sorted.slice(0, 3).map((item: any) => ({
              name: item.name,
              sales: item.units_sold || 0,
            })),
          );

          setLeast3Food(
            sorted
              .slice(-3)
              .reverse()
              .map((item: any) => ({
                name: item.name,
                sales: item.units_sold || 0,
              })),
          );

          if (Array.isArray(data.step1_data.financial_summary)) {
            const financialData: FinancialItem[] =
              data.step1_data.financial_summary;
            setFinancials(financialData);

            // Extract available years
            const years = Array.from(
              new Set(
                financialData.map((item) => item.month_year.split("-")[0]),
              ),
            ).sort();

            if (years.length > 0) {
              const thisYear = new Date().getFullYear().toString();
              // If current year exists in data, set it; otherwise default to the latest year available
              if (years.includes(thisYear)) {
                setSelectedYear(thisYear);
              } else {
                setSelectedYear(years[years.length - 1]); // Latest year
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch sheet analytics:", err);
      }
    }

    fetchSheetAnalytics();
  }, []);

  // 1. 提取所有可选年份
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    financials.forEach((item) => {
      const yr = item.month_year.split("-")[0];
      if (yr) years.add(yr);
    });
    return Array.from(years).sort();
  }, [financials]);

  // 2. 根据选中的年份过滤财务数据
  const filteredFinancials = useMemo(() => {
    const baseData =
      selectedYear === "All"
        ? financials
        : financials.filter((item) => item.month_year.startsWith(selectedYear));

    // 👈 按 month_year 从小到大排序 (如 2026-01 到 2026-12)
    return [...baseData].sort((a, b) =>
      a.month_year.localeCompare(b.month_year),
    );
  }, [financials, selectedYear]);

  // 3. 计算选定范围内的平均 AOV 与平均 Profit Margin
  const averages = useMemo(() => {
    if (filteredFinancials.length === 0) {
      return { avgAOV: "$0.00", avgProfitMargin: "0.0%" };
    }
    const totalAOV = filteredFinancials.reduce(
      (sum, item) => sum + item.aov,
      0,
    );
    const totalMargin = filteredFinancials.reduce(
      (sum, item) => sum + item.profit_margin,
      0,
    );

    const avgAOVVal = (totalAOV / filteredFinancials.length).toFixed(2);
    const avgMarginVal = (totalMargin / filteredFinancials.length).toFixed(1);

    return {
      avgAOV: `$${avgAOVVal}`,
      avgProfitMargin: `${avgMarginVal}%`,
    };
  }, [filteredFinancials]);

  return (
    <section aria-labelledby="summary-metrics">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2
            id="summary-metrics"
            className="mb-1 font-bold text-xl text-bs-neutral-900"
          >
            Top Summary Metrics
          </h2>
          <p className="text-sm text-bs-neutral-600">
            Trust, diner action, guest sentiment, sales efficiency, and footfall
            — at a glance.
          </p>
        </div>
      </div>

      {/* Row 1 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-bs-gold" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {rating}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Average Rating</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            {totalReviews.toLocaleString()} {source} reviews
          </p>
        </div>

        {/* Direction conversion */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Navigation className="text-bs-blue" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {conversion}%
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Direction Conversion</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Interested diners who click to get directions
          </p>
        </div>

        {/* Positive sentiment */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Smile className="text-bs-green" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {safePositive}%
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Positive Sentiment</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Share of reviews that sound positive
          </p>
        </div>

        {/* Weekly visitors */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-bs-blue" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {visitors.toLocaleString()}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Weekly Visitors</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            {dayCount > 0
              ? `Total across latest ${dayCount} chart day${
                  dayCount === 1 ? "" : "s"
                }`
              : "No foot traffic data yet"}
          </p>
        </div>
      </div>

      <br />

      {/* Row 2 Metrics (Design perfectly aligned with Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Revenue / Customer */}
        <div
          onClick={() => setActiveModal("aov")}
          className="bg-white rounded-lg border-2 border-bs-neutral-200 hover:border-emerald-500 transition-all cursor-pointer p-6 group"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign
              className="text-emerald-600 group-hover:scale-110 transition-transform"
              size={24}
            />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {averages.avgAOV}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">
            Avg Revenue / Customer ({selectedYear})
          </h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Click to view monthly trend
          </p>
        </div>

        {/* Monthly Profit Margin */}
        <div
          onClick={() => setActiveModal("profit")}
          className="bg-white rounded-lg border-2 border-bs-neutral-200 hover:border-purple-500 transition-all cursor-pointer p-6 group"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp
              className="text-purple-600 group-hover:scale-110 transition-transform"
              size={24}
            />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {averages.avgProfitMargin}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">
            Avg Profit Margin ({selectedYear})
          </h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Click to view monthly trend
          </p>
        </div>

        {/* Top 3 Food Block */}
        <div
          onClick={() => setActiveModal("top3")}
          className="bg-white rounded-lg border-2 border-bs-neutral-200 hover:border-amber-500 transition-all cursor-pointer p-6 group"
        >
          <div className="flex items-center justify-between mb-2">
            <Trophy
              className="text-amber-500 group-hover:scale-110 transition-transform"
              size={24}
            />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {top3Food.length > 0 ? top3Food[0].sales.toLocaleString() : 0}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600 flex items-center gap-1.5">
            <Utensils size={14} className="text-amber-600" />
            Top 3 Food
          </h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Click to view best sellers
          </p>
        </div>

        {/* Least 3 Food Block */}
        <div
          onClick={() => setActiveModal("least3")}
          className="bg-white rounded-lg border-2 border-bs-neutral-200 hover:border-rose-500 transition-all cursor-pointer p-6 group"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingDown
              className="text-rose-500 group-hover:scale-110 transition-transform"
              size={24}
            />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {least3Food.length > 0 ? least3Food[0].sales.toLocaleString() : 0}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600 flex items-center gap-1.5">
            <Utensils size={14} className="text-rose-600" />
            Least 3 Food
          </h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Click to view lowest sellers
          </p>
        </div>
      </div>

      {/* --- 通用 Pop-up Modal --- */}
      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-bs-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-bs-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                {activeModal === "top3" && (
                  <Trophy className="text-amber-500" size={22} />
                )}
                {activeModal === "least3" && (
                  <TrendingDown className="text-rose-500" size={22} />
                )}
                {activeModal === "aov" && (
                  <DollarSign className="text-emerald-600" size={22} />
                )}
                {activeModal === "profit" && (
                  <TrendingUp className="text-purple-600" size={22} />
                )}

                <h3 className="text-lg font-bold text-bs-neutral-900">
                  {activeModal === "top3" && "Top 3 Sales Dishes"}
                  {activeModal === "least3" && "Least 3 Sales Dishes"}
                  {activeModal === "aov" && "Monthly Avg Order Value (AOV)"}
                  {activeModal === "profit" && "Monthly Profit Margin (%)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-bs-neutral-400 hover:text-bs-neutral-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* 弹窗内的说明及年份筛选 */}
            <div className="flex items-center justify-between text-xs text-bs-neutral-500">
              <span>Synced directly from Google Sheet.</span>

              {(activeModal === "aov" || activeModal === "profit") &&
                availableYears.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-bs-neutral-100 px-2 py-1 rounded-md">
                    <span>Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="font-semibold text-bs-neutral-800 bg-transparent outline-none cursor-pointer"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </div>

            {/* 图表展示区 */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {activeModal === "top3" || activeModal === "least3" ? (
                  <BarChart
                    data={activeModal === "top3" ? top3Food : least3Food}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="sales"
                      fill={activeModal === "top3" ? "#f59e0b" : "#f43f5e"}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                ) : activeModal === "aov" ? (
                  <LineChart data={filteredFinancials}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month_year"
                      tick={{ fontSize: 11 }}
                      padding={{ left: 30, right: 30 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} unit="$" />
                    <Tooltip formatter={(value: any) => [`$${value}`, "AOV"]} />
                    <Line
                      type="monotone"
                      dataKey="aov"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  /* 3. Profit Margin 改为 LineChart (紫色折线) */
                  <LineChart data={filteredFinancials}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month_year"
                      tick={{ fontSize: 11 }}
                      padding={{ left: 30, right: 30 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(value: any) => [`${value}%`, "Margin"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit_margin"
                      stroke="#9333ea"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#9333ea" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-bs-neutral-900 hover:bg-bs-neutral-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
