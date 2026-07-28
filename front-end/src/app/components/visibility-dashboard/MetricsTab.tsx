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

  // --- State Initialization ---
  const currentYear = new Date().getFullYear().toString();
  const [financials, setFinancials] = useState<FinancialItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [top3Food, setTop3Food] = useState<FoodItem[]>([]);
  const [least3Food, setLeast3Food] = useState<FoodItem[]>([]);

  // Fetch sheet analytics
  useEffect(() => {
    async function fetchSheetAnalytics() {
      try {
        const response = await fetch(
          "http://localhost:8000/analytics/dashboard-data",
        );
        if (!response.ok) return;

        const data = await response.json();
        if (data.step1_data) {
          // Food data sorting
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

            const years = Array.from(
              new Set(
                financialData.map((item) => item.month_year.split("-")[0]),
              ),
            ).sort();

            if (years.length > 0) {
              const thisYear = new Date().getFullYear().toString();
              if (years.includes(thisYear)) {
                setSelectedYear(thisYear);
              } else {
                setSelectedYear(years[years.length - 1]);
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

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    financials.forEach((item) => {
      const yr = item.month_year.split("-")[0];
      if (yr) years.add(yr);
    });
    return Array.from(years).sort();
  }, [financials]);

  // Filtered Financials Sorted from 01 to 12
  const filteredFinancials = useMemo(() => {
    const baseData =
      selectedYear === "All"
        ? financials
        : financials.filter((item) => item.month_year.startsWith(selectedYear));

    return [...baseData].sort((a, b) =>
      a.month_year.localeCompare(b.month_year),
    );
  }, [financials, selectedYear]);

  // Average Calculations
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
      {/* Header Bar */}
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

      {/* Row 2 Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Avg Revenue / Customer Block */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-emerald-600" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {averages.avgAOV}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">
            Avg Revenue / Customer
          </h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Monthly average for {selectedYear}
          </p>
        </div>

        {/* Monthly Profit Margin Block */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-purple-600" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {averages.avgProfitMargin}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600">Avg Profit Margin</h3>
          <p className="text-xs text-bs-neutral-600 mt-1">
            Monthly average for {selectedYear}
          </p>
        </div>

        {/* Top 3 Food Block */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="text-amber-500" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {top3Food.length > 0 ? top3Food[0].sales.toLocaleString() : 0}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600 flex items-center gap-1.5">
            <Utensils size={14} className="text-amber-600" />
            Top Seller Qty
          </h3>
          <p className="text-xs text-bs-neutral-600 mt-1 truncate">
            {top3Food.length > 0
              ? `Max: ${top3Food[0].name}`
              : "Highest quantity sold"}
          </p>
        </div>

        {/* Least 3 Food Block */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="text-rose-500" size={24} />
            <span className="text-2xl font-bold text-bs-neutral-900">
              {least3Food.length > 0 ? least3Food[0].sales.toLocaleString() : 0}
            </span>
          </div>
          <h3 className="text-sm text-bs-neutral-600 flex items-center gap-1.5">
            <Utensils size={14} className="text-rose-600" />
            Lowest Seller Qty
          </h3>
          <p className="text-xs text-bs-neutral-600 mt-1 truncate">
            {least3Food.length > 0
              ? `Min: ${least3Food[0].name}`
              : "Lowest quantity sold"}
          </p>
        </div>
      </div>

      <br />

      {/* --- 2x2 Charts Section Below Blocks --- */}
      {/* Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        {availableYears.length > 0 && (
          <div className="mt-2 sm:mt-0 flex items-center gap-2 bg-white border border-bs-neutral-200 rounded-lg px-3 py-1.5 shadow-xs">
            <Calendar size={16} className="text-bs-neutral-500" />
            <span className="text-xs font-medium text-bs-neutral-600">
              Year:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-semibold text-bs-neutral-800 bg-transparent outline-none cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Chart 1: Avg Order Value (Line Chart) */}
        <div className="bg-white rounded-xl border border-bs-neutral-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-emerald-600" size={20} />
            <h3 className="font-semibold text-sm text-bs-neutral-800">
              Monthly Avg Order Value (AOV) - {selectedYear}
            </h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month_year"
                  tick={{ fontSize: 11 }}
                  padding={{ left: 30, right: 30 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  unit="$"
                  domain={["auto", "auto"]}
                />
                <Tooltip formatter={(value: any) => [`$${value}`, "AOV"]} />
                <Line
                  type="monotone"
                  dataKey="aov"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Profit Margin (Line Chart) */}
        <div className="bg-white rounded-xl border border-bs-neutral-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-purple-600" size={20} />
            <h3 className="font-semibold text-sm text-bs-neutral-800">
              Monthly Profit Margin (%) - {selectedYear}
            </h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month_year"
                  tick={{ fontSize: 11 }}
                  padding={{ left: 30, right: 30 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  unit="%"
                  domain={["auto", "auto"]}
                />
                <Tooltip formatter={(value: any) => [`${value}%`, "Margin"]} />
                <Line
                  type="monotone"
                  dataKey="profit_margin"
                  stroke="#9333ea"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#9333ea" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top 3 Food (Bar Chart) */}
        <div className="bg-white rounded-xl border border-bs-neutral-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-amber-500" size={20} />
            <h3 className="font-semibold text-sm text-bs-neutral-800">
              Top 3 Best Selling Dishes (Quantity)
            </h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top3Food}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [value, "Units Sold"]} />
                <Bar dataKey="sales" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Least 3 Food (Bar Chart) */}
        <div className="bg-white rounded-xl border border-bs-neutral-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-rose-500" size={20} />
            <h3 className="font-semibold text-sm text-bs-neutral-800">
              Least 3 Selling Dishes (Quantity)
            </h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={least3Food}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [value, "Units Sold"]} />
                <Bar dataKey="sales" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
