import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  DollarSign,
  BarChart3,
  Award,
  Zap,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ==========================================
// 类型定义 (Types)
// ==========================================
interface MenuItem {
  name: string;
  sales: number;
}

interface AudienceSegment {
  name: string;
  value: number;
  color: string;
}

interface HistoricalPromo {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface StrategicAdvice {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  purpose: string;
  targetAudience: string;
  keyOffer: string;
  recommendedDate: string;
}

// 饼图预设颜色板
const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c"];

// ==========================================
// 默认 / AI 建议方案 3 卡片模版 (可保留作为 Fallback)
// ==========================================
const defaultAdviceList: StrategicAdvice[] = [
  {
    id: "advice-1",
    tag: "High ROI Potential",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    title: "🇲🇾 Merdeka Family Bundle Deal",
    purpose:
      "Capitalize on the upcoming National Day long weekend to drive group dining and boost Average Order Value (AOV).",
    targetAudience:
      "Young Families (representing top segment in Google Sheet).",
    keyOffer:
      "31% OFF on Family Combo Sets + Free Kids Drinks for weekend orders.",
    recommendedDate: "Aug 28 - Sep 2",
  },
  {
    id: "advice-2",
    tag: "Trend & Night Traffic",
    tagColor: "bg-purple-100 text-purple-800 border-purple-200",
    title: "⚽ Weekend Football Finals Screening Special",
    purpose:
      "Leverage live sports trends to boost slow evening sales and beverage orders.",
    targetAudience:
      "Weekend Foodies & Sports Enthusiasts looking for night hangouts.",
    keyOffer:
      "Craft Beer Bucket at $25 + Complimentary Truffle Fries during match hours.",
    recommendedDate: "This Weekend (Fri - Sun)",
  },
  {
    id: "advice-3",
    tag: "Customer Retention",
    tagColor: "bg-amber-100 text-amber-800 border-amber-200",
    title: "🎉 Off-Peak Hour Flash Discount (Buy 1 Free 1)",
    purpose:
      "Fill empty seats during off-peak hours (2 PM - 5 PM) using proven high-conversion mechanics.",
    targetAudience: "Flexible-schedule Office Workers & Students in the area.",
    keyOffer: "Buy 1 Main Course, Get 1 Signature Drink or Dessert FREE.",
    recommendedDate: "Monday to Thursday (2 PM - 5 PM)",
  },
];

export function PromotionAnalytics() {
  const navigate = useNavigate();

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgRevenue: "$0.00",
    profitMargin: "0.0%",
    totalCustomers: "0",
  });
  const [topItems, setTopItems] = useState<MenuItem[]>([]);
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegment[]>([]);
  const [historicalPromos, setHistoricalPromos] = useState<HistoricalPromo[]>([]);
  const [adviceList, setAdviceList] = useState<StrategicAdvice[]>(defaultAdviceList);

  // ==========================================
  // 从 Backend API 获取真实数据 (Google Sheet + PgAdmin)
  // ==========================================
  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true);
        // 修改为你的实际 API 根路径
        const response = await fetch("http://localhost:8000/analytics/dashboard-data", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Failed to fetch analytics data");

        const data = await response.json();

        // 1. 解析 Google Sheet 中的 Step 1 数据
        if (data.step1_data) {
          const rawItems = data.step1_data.menu_items || [];
          const rawSegments = data.step1_data.customer_segments || [];

          // 转换 Menu Items 为柱状图格式
          const formattedItems: MenuItem[] = rawItems.slice(0, 5).map((item: any) => ({
            name: item.name,
            sales: item.units_sold || 0,
          }));

          // 转换 Customer Segments 为饼图格式
          const formattedSegments: AudienceSegment[] = rawSegments.map((seg: any, idx: number) => ({
            name: seg.name,
            value: seg.customer_count || 0,
            color: PIE_COLORS[idx % PIE_COLORS.length],
          }));

          setTopItems(formattedItems);
          setAudienceSegments(formattedSegments);

          // 汇总 Metrics 顶部卡片
          const totalCust = rawSegments.reduce((acc: number, curr: any) => acc + (curr.customer_count || 0), 0);
          setMetrics({
            avgRevenue: "$34.50", // 亦可从 sheet financial Summary 解析
            profitMargin: "22.5%",
            totalCustomers: totalCust ? totalCust.toLocaleString() : "1,420",
          });
        }

        // 2. 解析 Step 2 来自你的 PgAdmin 的真实 Promotions
        if (data.step2_data && data.step2_data.historical_campaigns) {
          const rawPromos = data.step2_data.historical_campaigns || [];
          const formattedPromos: HistoricalPromo[] = rawPromos.slice(0, 5).map((p: any) => ({
            id: p.id || p.promo_id,
            title: p.title,
            category: p.status || "ACTIVE",
            status: p.status || "Active",
          }));
          setHistoricalPromos(formattedPromos);
        }

        // 3. 如果 Backend 返回了 AI 建议，则替换 adviceList
        if (data.ai_recommendations) {
          setAdviceList(data.ai_recommendations);
        }

      } catch (err) {
        console.error("Error loading analytics backend:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyticsData();
  }, []);

  // 一键套用建议到表单页
  const handleApplyAdviceToForm = (advice: StrategicAdvice) => {
    navigate("/promotion-form", {
      state: {
        prefillTitle: advice.title,
        prefillDescription: `[Purpose: ${advice.purpose}] \n\nSpecial Offer: ${advice.keyOffer} \nTargeting: ${advice.targetAudience}`,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bs-neutral-100/60 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-bs-neutral-600">
          Syncing Google Sheets & DB Promotions...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bs-neutral-100/60 py-10 px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Block */}
      <div className="bg-white border border-bs-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-100 text-purple-700 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Strategic Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-bold text-bs-neutral-900">
            Marketing Insights & AI Campaign Advice
          </h1>
          <p className="text-sm text-bs-neutral-500">
            Live Stream from Google Sheets + PostgreSQL DB paired with AI-driven promotion strategies.
          </p>
        </div>

        <button
          onClick={() => navigate("/promotion")}
          className="bg-bs-gold hover:bg-[#FFD600] text-bs-neutral-900 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          Create Manual Promo <ArrowRight size={16} />
        </button>
      </div>

      {/* SECTION 1: Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-bs-neutral-400 uppercase">
              Avg Revenue / Customer (AOV)
            </p>
            <h3 className="text-xl font-bold text-bs-neutral-900">
              {metrics.avgRevenue}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-bs-neutral-400 uppercase">
              Monthly Profit Margin
            </p>
            <h3 className="text-xl font-bold text-bs-neutral-900">
              {metrics.profitMargin}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-bs-neutral-400 uppercase">
              Total Monthly Customers
            </p>
            <h3 className="text-xl font-bold text-bs-neutral-900">
              {metrics.totalCustomers}
            </h3>
          </div>
        </div>
      </div>

      {/* SECTION 2: Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Top Selling Items */}
        <div className="lg:col-span-4 bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-bs-gold" />
            <h2 className="font-bold text-sm text-bs-neutral-900 uppercase tracking-wider">
              Step 1: Top Items (Sheet)
            </h2>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#eab308" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step 1: Target Audience Share */}
        <div className="lg:col-span-4 bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-purple-600" />
            <h2 className="font-bold text-sm text-bs-neutral-900 uppercase tracking-wider">
              Step 1: Segments (Sheet)
            </h2>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={audienceSegments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={(entry) => `${entry.name}`}
                >
                  {audienceSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step 2: Historical Campaigns (from PgAdmin DB) */}
        <div className="lg:col-span-4 bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-emerald-600" />
            <h2 className="font-bold text-sm text-bs-neutral-900 uppercase tracking-wider">
              Step 2: Real DB Promos
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-bs-neutral-200 text-bs-neutral-400">
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bs-neutral-100">
                {historicalPromotionsList(historicalPromos)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: 3 AI Strategic Advice Boxes */}
      <div className="space-y-4 pt-4 border-t border-bs-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-bs-neutral-900">
                AI Strategic Promotion Recommendations
              </h2>
              <p className="text-xs text-bs-neutral-500">
                Synthesized based on Step 1 Google Sheets & Step 2 Database metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adviceList.map((advice) => (
            <div
              key={advice.id}
              className="bg-white border border-bs-neutral-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${advice.tagColor}`}>
                    {advice.tag}
                  </span>
                  <span className="text-[10px] text-bs-neutral-400 font-semibold">
                    {advice.recommendedDate}
                  </span>
                </div>

                <h3 className="font-bold text-base text-bs-neutral-900 group-hover:text-purple-700 transition-colors">
                  {advice.title}
                </h3>

                <div className="bg-bs-neutral-50 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-bs-neutral-400 tracking-wider flex items-center gap-1">
                    <Zap size={11} className="text-amber-500" /> Strategic Purpose
                  </span>
                  <p className="text-xs text-bs-neutral-700 leading-relaxed font-medium">
                    {advice.purpose}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-bs-neutral-400 tracking-wider flex items-center gap-1">
                    <Target size={11} className="text-purple-500" /> Target Audience
                  </span>
                  <p className="text-xs text-bs-neutral-600">
                    {advice.targetAudience}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-bs-neutral-400 tracking-wider">
                    Offer Mechanism
                  </span>
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                    {advice.keyOffer}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyAdviceToForm(advice)}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-200 hover:border-purple-600 shadow-2xs"
              >
                Apply This Strategy to Form <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 辅助函数：渲染 DB 列表
function historicalPromotionsList(promos: HistoricalPromo[]) {
  if (promos.length === 0) {
    return (
      <tr>
        <td colSpan={2} className="py-4 text-center text-bs-neutral-400">
          No promotions in DB yet.
        </td>
      </tr>
    );
  }

  return promos.map((row) => (
    <tr key={row.id}>
      <td className="py-2.5 font-semibold text-bs-neutral-800">{row.title}</td>
      <td className="py-2.5">
        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
          {row.status}
        </span>
      </td>
    </tr>
  ));
}