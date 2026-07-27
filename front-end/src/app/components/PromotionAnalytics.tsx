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
// 模拟 Step 1 & Step 2 数据集
// ==========================================
const step1Data = {
  metrics: {
    avgRevenuePerCustomer: "$35.00",
    monthlyProfitMargin: "22.5%",
    totalCustomersServed: "1,420",
  },
  // Step 1: 热销菜品数据 (用于柱状图)
  topItems: [
    { name: "Truffle Burger", sales: 420 },
    { name: "Craft Beer", sales: 380 },
    { name: "Family Combo", sales: 290 },
    { name: "Matcha Latte", sales: 210 },
  ],
  // Step 1: 客群分布数据 (用于饼图)
  targetAudienceBreakdown: [
    { name: "Young Families", value: 45, color: "#8884d8" },
    { name: "Weekend Foodies", value: 30, color: "#82ca9d" },
    { name: "Office Workers", value: 15, color: "#ffc658" },
    { name: "Students", value: 10, color: "#ff8042" },
  ],
};

const step2Data = {
  // Step 2: 历史营销活动表现数据 (用于表格)
  historicalPromotions: [
    {
      id: "h1",
      title: "Buy 1 Free 1 Happy Hour",
      category: "Alcohol & Drinks",
      conversionRate: "31%",
      roi: "4.1x",
      revenueGenerated: "$4,200",
      status: "High Performing",
    },
    {
      id: "h2",
      title: "Summer Family Feast 15% OFF",
      category: "Combo Deal",
      conversionRate: "24%",
      roi: "3.2x",
      revenueGenerated: "$6,800",
      status: "Stable",
    },
    {
      id: "h3",
      title: "Lunch Set Voucher 10%",
      category: "Discount",
      conversionRate: "12%",
      roi: "1.8x",
      revenueGenerated: "$1,500",
      status: "Underperforming",
    },
  ],
};

// ==========================================
// 方案 3：专门的 3 个 AI Strategic Promotion Advice Boxes
// ==========================================
const strategicAdviceList = [
  {
    id: "advice-1",
    tag: "High ROI Potential",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    title: "🇲🇾 Merdeka Family Bundle Deal",
    purpose:
      "Capitalize on the upcoming National Day long weekend to drive group dining and boost Average Order Value (AOV).",
    targetAudience:
      "Young Families (representing 45% of your customer base in Step 1).",
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
      "Leverage current live sports trend to boost slow evening sales and drive high-margin alcohol/beverage sales.",
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
      "Replicate your top-performing historical campaign (31% conversion rate from Step 2) to fill empty seats between 2PM - 5PM.",
    targetAudience: "Flexible-schedule Office Workers & Students in the area.",
    keyOffer: "Buy 1 Main Course, Get 1 Signature Drink or Dessert FREE.",
    recommendedDate: "Monday to Thursday (2 PM - 5 PM)",
  },
];

export function PromotionAnalytics() {
  const navigate = useNavigate();

  // 一键套用建议到表单页
  const handleApplyAdviceToForm = (advice: (typeof strategicAdviceList)[0]) => {
    // 可以通过 state / query params 传给 PromotionForm 页面
    navigate("/promotion-form", {
      state: {
        prefillTitle: advice.title,
        prefillDescription: `[Purpose: ${advice.purpose}] \n\nSpecial Offer: ${advice.keyOffer} \nTargeting: ${advice.targetAudience}`,
      },
    });
  };

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
            Visualizing Step 1 & Step 2 merchant metrics paired with 3 targeted
            AI-driven promotion strategies.
          </p>
        </div>

        <button
          onClick={() => navigate("/promotion")}
          className="bg-bs-gold hover:bg-[#FFD600] text-bs-neutral-900 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          Create Manual Promo <ArrowRight size={16} />
        </button>
      </div>
      {/* ======================================================== */}
      // SECTION 1: Top Key Performance Indicators (Step 1 Metrics)
      {/* ======================================================== */}
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
              {step1Data.metrics.avgRevenuePerCustomer}
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
              {step1Data.metrics.monthlyProfitMargin}
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
              {step1Data.metrics.totalCustomersServed}
            </h3>
          </div>
        </div>
      </div>
      {/* ======================================================== */}
      // SECTION 2: Step 1 Charts & Step 2 Performance Table
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Top Selling Items (Bar Chart) */}
        <div className="lg:col-span-4 bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-bs-gold" />
            <h2 className="font-bold text-sm text-bs-neutral-900 uppercase tracking-wider">
              Step 1: Top Selling Items
            </h2>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={step1Data.topItems}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#eab308" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step 1: Target Audience Share (Pie Chart) */}
        <div className="lg:col-span-4 bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-purple-600" />
            <h2 className="font-bold text-sm text-bs-neutral-900 uppercase tracking-wider">
              Step 1: Customer Segments
            </h2>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={step1Data.targetAudienceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={(entry) => `${entry.name}`}
                >
                  {step1Data.targetAudienceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step 2: Historical Campaign Performance (Table) */}
        <div className="lg:col-span-4 bg-white border border-bs-neutral-200 p-5 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-emerald-600" />
            <h2 className="font-bold text-sm text-bs-neutral-900 uppercase tracking-wider">
              Step 2: Historical Campaigns
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-bs-neutral-200 text-bs-neutral-400">
                  <th className="pb-2">Campaign Title</th>
                  <th className="pb-2">Conversion</th>
                  <th className="pb-2">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bs-neutral-100">
                {step2Data.historicalPromotions.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 font-semibold text-bs-neutral-800">
                      {row.title}
                    </td>
                    <td className="py-2.5 font-bold text-emerald-600">
                      {row.conversionRate}
                    </td>
                    <td className="py-2.5 font-bold text-indigo-600">
                      {row.roi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ======================================================== */}
      // SECTION 3: 方案 3 的核心 —— 3 个 AI Strategic Promotion Boxes
      {/* ======================================================== */}
      <div className="space-y-4 pt-4 border-t border-bs-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-bs-neutral-900">
                AI Strategic Promotion Recommendations (方案 3)
              </h2>
              <p className="text-xs text-bs-neutral-500">
                Synthesized based on Step 1 & Step 2 analytics + current market
                calendar.
              </p>
            </div>
          </div>
        </div>

        {/* 3 大 Advice Boxes 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {strategicAdviceList.map((advice) => (
            <div
              key={advice.id}
              className="bg-white border border-bs-neutral-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                {/* Header Badge & Title */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${advice.tagColor}`}
                  >
                    {advice.tag}
                  </span>
                  <span className="text-[10px] text-bs-neutral-400 font-semibold">
                    {advice.recommendedDate}
                  </span>
                </div>

                <h3 className="font-bold text-base text-bs-neutral-900 group-hover:text-purple-700 transition-colors">
                  {advice.title}
                </h3>

                {/* Purpose Block */}
                <div className="bg-bs-neutral-50 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-bs-neutral-400 tracking-wider flex items-center gap-1">
                    <Zap size={11} className="text-amber-500" /> Strategic
                    Purpose
                  </span>
                  <p className="text-xs text-bs-neutral-700 leading-relaxed font-medium">
                    {advice.purpose}
                  </p>
                </div>

                {/* Target Audience Block */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-bs-neutral-400 tracking-wider flex items-center gap-1">
                    <Target size={11} className="text-purple-500" /> Target
                    Audience
                  </span>
                  <p className="text-xs text-bs-neutral-600">
                    {advice.targetAudience}
                  </p>
                </div>

                {/* Key Offer Details */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-bs-neutral-400 tracking-wider">
                    Offer Mechanism
                  </span>
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                    {advice.keyOffer}
                  </p>
                </div>
              </div>

              {/* Action Button: Apply directly */}
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
