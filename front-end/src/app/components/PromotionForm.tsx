import { useState } from "react";
import type { AIPromotionRecommendation } from "../types/aipromotion";
import { useNavigate, useLocation } from "react-router";
import {
  Megaphone,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  Upload,
  AlertCircle,
  Sparkles,
  Wand2,
  RefreshCw,
  X,
  Check,
  Database,
  TrendingUp,
} from "lucide-react";
import type { Promotion } from "../types/promotion";
import { PromotionCard } from "./PromotionCard";

interface PromotionFormProps {
  initialData?: Promotion;
  onSubmit?: (promotion: Promotion) => void;
}

interface FormErrors {
  title?: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export function PromotionForm({ initialData, onSubmit }: PromotionFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = location.state as {
    prefillTitle?: string;
    prefillDescription?: string;
  } | null;
  // const [title, setTitle] = useState(initialData?.title ?? "");
  // const [description, setDescription] = useState(
  //   initialData?.description ?? "",
  // );
  const [title, setTitle] = useState(
    prefilled?.prefillTitle ?? initialData?.title ?? "",
  );
  const [description, setDescription] = useState(
    prefilled?.prefillDescription ?? initialData?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl ?? "");

  const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "");

  const [startTime, setStartTime] = useState(initialData?.startTime ?? "");
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "");

  const [isAllDay, setIsAllDay] = useState(
    initialData
      ? initialData.startTime === "" && initialData.endTime === ""
      : true,
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- 方案 2：全量 AI 助手弹窗状态 ---
  // const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  // const [aiPromptInput, setAiPromptInput] = useState("");
  // const [isAiProcessing, setIsAiProcessing] = useState(false);
  // const [aiGeneratedResult, setAiGeneratedResult] = useState<{
  //   title: string;
  //   description: string;
  //   imageUrl: string;
  //   eventTag?: string;
  // } | null>(null);

  // // --- 方案 1：独立字段 AI 生成状态与多轮生成计数器 ---
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [titleGenCount, setTitleGenCount] = useState(0); // 记录 Title 重写次数
  const [descGenCount, setDescGenCount] = useState(0); // 记录 Desc 重写次数

  // // ==========================================
  // // 1. 动态日历与趋势 Context 获取区
  // // ==========================================
  // const getCurrentMarketTrends = () => {
  //   const today = new Date();
  //   const formattedDate = today.toISOString().split("T")[0];

  //   return {
  //     currentDate: formattedDate,
  //     season: "Summer",
  //     upcomingHolidaysAndEvents: [
  //       {
  //         name: "National Day / Merdeka Special",
  //         category: "Holiday",
  //         date: "Aug 31",
  //       },
  //       {
  //         name: "School Holiday Season",
  //         category: "Calendar",
  //         date: "Aug - Sep",
  //       },
  //       {
  //         name: "Football Finals Night (Live Screen)",
  //         category: "Sports Trend",
  //         date: "This Weekend",
  //       },
  //     ],
  //   };
  // };

  // // ==========================================
  // // 2. 结合 Step 1/2 数据与实时 Trend 打包 Payload
  // // ==========================================
  // const getFullContextPayload = () => {
  //   return {
  //     market_trends: getCurrentMarketTrends(),
  //     step1_merchant_metrics: {
  //       avgRevenuePerCustomer: "$35",
  //       monthlyProfitMargin: "22%",
  //       targetAudience: "Young Families & Weekend Foodies",
  //       topSellingItems: ["Truffle Burger", "Craft Beer", "Family Combo"],
  //     },
  //     step2_historical_promotions: [
  //       {
  //         title: "Summer Family Feast 15% OFF",
  //         conversionRate: "24%",
  //         roi: "3.2x",
  //       },
  //       {
  //         title: "Buy 1 Get 1 Cocktail Happy Hour",
  //         conversionRate: "31%",
  //         roi: "4.1x",
  //       },
  //     ],
  //   };
  // };

  // // ==========================================
  // // API 逻辑区
  // // ==========================================

  // // [方案 2] 全局生成：结合日历热点 + 商家 Step 1&2 数据
  // const handleRunAiAssistant = async (customPrompt?: string) => {
  //   const activePrompt = customPrompt || aiPromptInput;
  //   if (!activePrompt.trim()) return;

  //   setIsAiProcessing(true);
  //   setAiGeneratedResult(null);

  //   const fullContext = getFullContextPayload();

  //   const apiPayload = {
  //     userIdea: activePrompt,
  //     context: fullContext,
  //   };

  //   console.log("🚀 [AI Full Campaign Request Payload]:", apiPayload);

  //   setTimeout(() => {
  //     let mockResult = {
  //       title: `🇲🇾 National Day Celebration: 31% OFF ${activePrompt}!`,
  //       description: `Celebrate National Day with family & friends! Enjoy 31% OFF on our best-selling ${fullContext.step1_merchant_metrics.topSellingItems[0]} and family bundles. Valid through the holiday week!`,
  //       imageUrl:
  //         "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",
  //       eventTag: "National Day Special",
  //     };

  //     if (
  //       activePrompt.toLowerCase().includes("football") ||
  //       activePrompt.toLowerCase().includes("sports")
  //     ) {
  //       mockResult = {
  //         title: `⚽ Match Night Craze: Live Screening & Beer Buckets!`,
  //         description: `Catch the live football finals this weekend! Bring your crew to enjoy live screening along with our special Craft Beer Bucket Deals and Truffle Burgers. Limited seating available!`,
  //         imageUrl:
  //           "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop",
  //         eventTag: "Live Sports Trend",
  //       };
  //     } else if (
  //       activePrompt.toLowerCase().includes("school") ||
  //       activePrompt.toLowerCase().includes("holiday") ||
  //       activePrompt.toLowerCase().includes("family")
  //     ) {
  //       mockResult = {
  //         title: `🎉 School Holiday Family Treat: Kids Eat Free!`,
  //         description: `School's out, fun's in! Treat your family during this school break. Buy any 2 main courses from our special menu and get a Kid's Meal completely FREE!`,
  //         imageUrl:
  //           "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop",
  //         eventTag: "School Break Trend",
  //       };
  //     }

  //     setAiGeneratedResult(mockResult);
  //     setIsAiProcessing(false);
  //   }, 1500);
  // };

  // // [方案 1] 改进版 Title 生成：基于现有文字保留主题变体 + 递增版本
  // const handleGenerateTitleOnly = async () => {
  //   setIsGeneratingTitle(true);
  //   const nextCount = titleGenCount + 1;
  //   setTitleGenCount(nextCount);

  //   const apiPayload = {
  //     field: "title",
  //     currentInputText: title.trim(), // 传入当前框内文本
  //     iterationIndex: nextCount, // 传入生成的次数，提示后端生成不同变体
  //     context: getFullContextPayload(),
  //   };

  //   console.log("🚀 [AI Regenerate Title Request]:", apiPayload);

  //   setTimeout(() => {
  //     if (title.trim()) {
  //       // 当框内已有字时：保持原有主题进行变体生成 (Based on existing keyword)
  //       const base = title.trim();
  //       const Variations = [
  //         `🇲🇾 ${base} Special: Buy 1 Free 1 Deal!`,
  //         `🔥 Festive Promo: ${base} Bundle Offer`,
  //         `🎉 Special Celebration: ${base} - Exclusive Discount!`,
  //         `✨ Limited Time: ${base} (Weekend Only)`,
  //       ];
  //       // 循环取不同版本，保证每次按都不一样
  //       setTitle(Variations[(nextCount - 1) % Variations.length]);
  //     } else {
  //       // 当框内为空时：结合当前最火 Trend 填充
  //       const TrendTitles = [
  //         "🇲🇾 Merdeka Day Special: 31% OFF Family Set",
  //         "⚽ Weekend Match Night: Free Craft Beer with Burger",
  //         "🎉 School Break Holiday Feast: Kids Eat Free",
  //       ];
  //       setTitle(TrendTitles[(nextCount - 1) % TrendTitles.length]);
  //     }

  //     setIsGeneratingTitle(false);
  //     setErrors((prev) => ({ ...prev, title: undefined }));
  //   }, 1000);
  // };

  // // [方案 1] 改进版 Description 生成：基于现有文字优化 + 多轮不重复
  // const handleGenerateDescOnly = async () => {
  //   setIsGeneratingDesc(true);
  //   const nextCount = descGenCount + 1;
  //   setDescGenCount(nextCount);

  //   const apiPayload = {
  //     field: "description",
  //     currentTitle: title.trim(),
  //     currentInputText: description.trim(), // 传入当前框内文本
  //     iterationIndex: nextCount, // 传入轮次，要求后端生成全新切入点
  //     context: getFullContextPayload(),
  //   };

  //   console.log("🚀 [AI Regenerate Description Request]:", apiPayload);

  //   setTimeout(() => {
  //     const topic = title ? `for "${title}"` : "for your restaurant offer";
  //     const fullContext = getFullContextPayload();
  //     const topItem = fullContext.step1_merchant_metrics.topSellingItems[0];

  //     // 提供多套不同切入点 (Angle) 的文案模板，每次点击生成下一版
  //     const descVariations = [
  //       `🔥 Exclusive Deal ${topic}! Indulge in our famous ${topItem} with special holiday pricing. Perfect for gathering with family & friends. Book your table now before slots run out!`,
  //       `🎉 Limited-Time Offer ${topic}! Tailored specially for food lovers. Enjoy premium quality ingredients, handcrafted cocktails, and great ambiance. Available this week only!`,
  //       `✨ Celebrate with us ${topic}! Claim your special discount on signature menu items. Bring your loved ones and experience an unforgettable meal. Order or reserve online today!`,
  //       `🇲🇾 Season Special ${topic}! Don't miss out on our best-selling combo deals. High customer satisfaction guaranteed. T&C apply, offer valid while stocks last!`,
  //     ];

  //     // 每次点击递增选下一版，彻底杜绝重复
  //     setDescription(descVariations[(nextCount - 1) % descVariations.length]);

  //     setIsGeneratingDesc(false);
  //     setErrors((prev) => ({ ...prev, description: undefined }));
  //   }, 1000);
  // };

  // // 应用方案 2 的结果
  // const handleApplyAiResult = () => {
  //   if (!aiGeneratedResult) return;
  //   setTitle(aiGeneratedResult.title);
  //   setDescription(aiGeneratedResult.description);
  //   setImageUrl(aiGeneratedResult.imageUrl);

  //   setErrors((prev) => ({
  //     ...prev,
  //     title: undefined,
  //     description: undefined,
  //     imageUrl: undefined,
  //   }));

  //   setIsAiModalOpen(false);
  //   setAiPromptInput("");
  //   setAiGeneratedResult(null);
  // };

  // --- AI Modal State ---
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<
    AIPromotionRecommendation[]
  >([]);
  const [aiApiError, setAiApiError] = useState<string | null>(null);

  // ==========================================
  // Fetch AI Recommendations from Backend
  // ==========================================
  const handleFetchAiRecommendations = async (customPrompt?: string) => {
    const activeInput =
      customPrompt !== undefined ? customPrompt : aiPromptInput;

    setIsAiProcessing(true);
    setAiApiError(null);
    setAiRecommendations([]);

    try {
      const response = await fetch(
        "http://localhost:8000/api/ai/recommendations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_input: activeInput.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate recommendations (${response.status})`,
        );
      }

      const result = await response.json();

      // Store the list of up to 3 promotions
      if (result.promotions && Array.isArray(result.promotions)) {
        setAiRecommendations(result.promotions);
      } else {
        setAiRecommendations([]);
      }
    } catch (err: any) {
      console.error("Error fetching AI promotions:", err);
      setAiApiError(err.message || "Failed to contact AI service.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  // ==========================================
  // Apply Selected AI Recommendation to Form
  // ==========================================
  const handleApplyRecommendation = (rec: AIPromotionRecommendation) => {
    setTitle(rec.title);
    setDescription(rec.description);
    if (rec.suggested_image_url) setImageUrl(rec.suggested_image_url);
    if (rec.suggested_start_date) setStartDate(rec.suggested_start_date);
    if (rec.suggested_end_date) setEndDate(rec.suggested_end_date);

    setIsAllDay(rec.is_all_day);
    if (!rec.is_all_day) {
      if (rec.suggested_start_time) setStartTime(rec.suggested_start_time);
      if (rec.suggested_end_time) setEndTime(rec.suggested_end_time);
    } else {
      setStartTime("");
      setEndTime("");
    }

    // Clear any validation errors and close modal
    setErrors({});
    setIsAiModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
          setErrors((prev) => ({ ...prev, imageUrl: undefined }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) newErrors.title = "Promotion title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!imageUrl) newErrors.imageUrl = "Please upload a banner image";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "End date cannot be earlier than start date";
    }

    if (!isAllDay) {
      if (!startTime) newErrors.startTime = "Start time is required";
      if (!endTime) newErrors.endTime = "End time is required";

      if (
        startDate &&
        endDate &&
        startDate === endDate &&
        startTime &&
        endTime &&
        startTime > endTime
      ) {
        newErrors.endTime = "End time must be after start time on the same day";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const token = localStorage.getItem("bitescouts_token");

      const payload = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        startDate,
        endDate,
        startTime: isAllDay ? null : startTime || null,
        endTime: isAllDay ? null : endTime || null,
        isAllDay,
        status: "ACTIVE",
        ...(initialData?.promoId ? { promoId: initialData.promoId } : {}),
      };

      const isEdit = Boolean(
        initialData && (initialData.id || initialData.promoId),
      );
      const targetId = initialData?.id || initialData?.promoId;
      const url = isEdit
        ? `http://localhost:8000/promotions/${targetId}`
        : "http://localhost:8000/promotions";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        const errorMsg = Array.isArray(resData.detail)
          ? resData.detail
              .map((d: any) => `${d.loc?.join(".")}: ${d.msg}`)
              .join(", ")
          : resData.detail || "Failed to save promotion";
        throw new Error(errorMsg);
      }

      onSubmit?.(resData);
      navigate("/promotion");
    } catch (err: any) {
      console.error("Failed to save promotion:", err);
      setApiError(err.message || "Failed to save promotion to database");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPromoState: Promotion = {
    promoId: initialData?.promoId ?? "preview-id",
    id: initialData?.id ?? "1",
    title: title || "Your Promotion Title",
    description:
      description ||
      "Write a brief and catchy description of your special offer here.",
    imageUrl:
      imageUrl ||
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop",
    websiteUrl: websiteUrl || "#",
    startDate: startDate || new Date().toISOString().split("T")[0],
    endDate:
      endDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    startTime: isAllDay ? "" : startTime,
    endTime: isAllDay ? "" : endTime,
    isAllDay,
  };

  // const marketTrends = getCurrentMarketTrends();

  // 1. Handle Inline Title Rewrite Call
  const handleGenerateTitleOnly = async () => {
    setIsGeneratingTitle(true);
    const nextCount = titleGenCount + 1;
    setTitleGenCount(nextCount);

    try {
      const res = await fetch("http://localhost:8000/api/ai/rewrite-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "title",
          current_text: title.trim(),
          iteration_index: nextCount,
        }),
      });

      if (!res.ok) throw new Error("Failed to rewrite title");

      const data = await res.json();
      if (data.generated_text) {
        setTitle(data.generated_text);
        setErrors((prev) => ({ ...prev, title: undefined }));
      }
    } catch (err) {
      console.error("Error generating title:", err);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // 2. Handle Inline Description Rewrite Call
  const handleGenerateDescOnly = async () => {
    setIsGeneratingDesc(true);
    const nextCount = descGenCount + 1;
    setDescGenCount(nextCount);

    try {
      const res = await fetch("http://localhost:8000/api/ai/rewrite-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "description",
          current_title: title.trim(),
          current_text: description.trim(),
          iteration_index: nextCount,
        }),
      });

      if (!res.ok) throw new Error("Failed to rewrite description");

      const data = await res.json();
      if (data.generated_text) {
        setDescription(data.generated_text);
        setErrors((prev) => ({ ...prev, description: undefined }));
      }
    } catch (err) {
      console.error("Error generating description:", err);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  return (
    <div className="min-h-screen bg-bs-neutral-100/60 py-10 px-4 md:px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header Block 带方案 2 入口 */}
        <div className="bg-white border border-bs-neutral-200/80 rounded-2xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-bs-gold/10 rounded-xl text-bs-gold">
              <Megaphone size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-bs-neutral-900 leading-none mb-1">
                {initialData ? "Edit Promotion" : "Create Promotion"}
              </h1>
              <p className="text-sm text-bs-neutral-500">
                Design custom marketing promotions to boost your restaurant's
                visibility.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Sparkles size={16} className="text-purple-200 animate-pulse" />
            AI Trend Campaign Planner
          </button>
        </div>

        {/* Dynamic Two-Column Layout */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Form Controls (Left Column) */}
          <div className="lg:col-span-7 bg-white border border-bs-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Title 带 [方案 1 改进版] 变体生成 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-bs-neutral-800">
                  Promotion Title <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTitleOnly}
                  disabled={isGeneratingTitle}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingTitle ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Wand2 size={12} />
                  )}
                  {title
                    ? `Rewrite Title (v${titleGenCount + 1})`
                    : "AI Generate Title"}
                </button>
              </div>
              <input
                className={`w-full border rounded-xl p-3 outline-none text-bs-neutral-800 transition-all placeholder:text-bs-neutral-400
                  ${
                    errors.title
                      ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/10"
                      : "border-bs-neutral-300 hover:border-bs-neutral-400 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20"
                  }`}
                placeholder="e.g. merdeka with 10%"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title)
                    setErrors((prev) => ({ ...prev, title: undefined }));
                }}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                  <AlertCircle size={13} /> {errors.title}
                </p>
              )}
            </div>

            {/* Description 带 [方案 1 改进版] 多轮不重复生成 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-bs-neutral-800">
                  Description <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescOnly}
                  disabled={isGeneratingDesc}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingDesc ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Wand2 size={12} />
                  )}
                  {description
                    ? `Generate Next Idea (v${descGenCount + 1})`
                    : "AI Generate Copy"}
                </button>
              </div>
              <textarea
                rows={4}
                className={`w-full border rounded-xl p-3 outline-none text-bs-neutral-800 transition-all placeholder:text-bs-neutral-400 resize-none
                  ${
                    errors.description
                      ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/10"
                      : "border-bs-neutral-300 hover:border-bs-neutral-400 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20"
                  }`}
                placeholder="Describe your special offer and any terms..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description)
                    setErrors((prev) => ({ ...prev, description: undefined }));
                }}
              />
              {errors.description && (
                <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                  <AlertCircle size={13} /> {errors.description}
                </p>
              )}
            </div>

            {/* Image Upload Area */}
            <div>
              <label className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-bs-neutral-800">
                <ImageIcon size={16} className="text-bs-neutral-500" />
                Promotion Banner Image <span className="text-red-500">*</span>
              </label>

              <input
                type="file"
                id="promo-image-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() =>
                  document.getElementById("promo-image-upload")?.click()
                }
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                  ${
                    imageUrl
                      ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : errors.imageUrl
                        ? "border-red-500 bg-red-50/30 hover:bg-red-50/50"
                        : "border-bs-neutral-300 hover:border-bs-gold bg-bs-neutral-50 hover:bg-bs-neutral-100/50"
                  }`}
              >
                {imageUrl ? (
                  <div className="text-center space-y-3">
                    <img
                      src={imageUrl}
                      alt="Upload Preview"
                      className="max-h-32 rounded-lg mx-auto shadow-sm object-cover"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Image Loaded
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl("");
                        }}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div
                      className={`p-3 bg-white border rounded-xl inline-block shadow-sm ${
                        errors.imageUrl
                          ? "text-red-500 border-red-200"
                          : "text-bs-neutral-500 border-bs-neutral-200"
                      }`}
                    >
                      <Upload size={22} />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          errors.imageUrl
                            ? "text-red-700"
                            : "text-bs-neutral-800"
                        }`}
                      >
                        Click to upload promotion image
                      </p>
                      <p className="text-xs text-bs-neutral-400 mt-1">
                        PNG, JPG, JPEG up to 5MB (Base64 encoded)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {errors.imageUrl && (
                <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                  <AlertCircle size={13} /> {errors.imageUrl}
                </p>
              )}
            </div>

            {/* Website URL */}
            <div>
              <label className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-bs-neutral-800">
                <LinkIcon size={16} className="text-bs-neutral-500" />
                Website URL
              </label>
              <input
                type="url"
                className="w-full border border-bs-neutral-300 hover:border-bs-neutral-400 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20 rounded-xl p-3 outline-none text-bs-neutral-800 transition-all placeholder:text-bs-neutral-400"
                placeholder="https://yourrestaurant.com/offers"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            {/* Timing & Dates Block */}
            <div className="pt-4 border-t border-bs-neutral-100 space-y-5">
              <div className="flex items-center gap-2 text-bs-neutral-800 mb-1">
                <Calendar size={18} className="text-bs-neutral-500" />
                <h3 className="font-bold text-base">Schedule Details</h3>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-bs-neutral-500 tracking-wider">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full border rounded-xl p-3 outline-none text-bs-neutral-800 transition-all
                      ${
                        errors.startDate
                          ? "border-red-500 focus:border-red-600"
                          : "border-bs-neutral-300 focus:border-bs-gold"
                      }`}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        startDate: undefined,
                        endDate: undefined,
                      }));
                    }}
                  />
                  {errors.startDate && (
                    <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                      <AlertCircle size={13} /> {errors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-bs-neutral-500 tracking-wider">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full border rounded-xl p-3 outline-none text-bs-neutral-800 transition-all
                      ${
                        errors.endDate
                          ? "border-red-500 focus:border-red-600"
                          : "border-bs-neutral-300 focus:border-bs-gold"
                      }`}
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        endDate: undefined,
                      }));
                    }}
                  />
                  {errors.endDate && (
                    <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                      <AlertCircle size={13} /> {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* All-Day checkbox & time selectors */}
              <div className="space-y-4 pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => {
                      setIsAllDay(e.target.checked);
                      if (e.target.checked) {
                        setStartTime("");
                        setEndTime("");
                        setErrors((prev) => ({
                          ...prev,
                          startTime: undefined,
                          endTime: undefined,
                        }));
                      }
                    }}
                    className="h-5 w-5 rounded-md border-bs-neutral-300 text-bs-gold focus:ring-bs-gold cursor-pointer accent-bs-gold"
                  />
                  <span className="text-sm font-semibold text-bs-neutral-700 group-hover:text-bs-neutral-900 transition-colors">
                    Available All Day
                  </span>
                </label>

                {!isAllDay && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                      <label className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-bs-neutral-500 tracking-wider">
                        <Clock size={12} /> Start Time{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className={`w-full border rounded-xl p-3 outline-none text-bs-neutral-800 transition-all
                          ${
                            errors.startTime
                              ? "border-red-500 focus:border-red-600"
                              : "border-bs-neutral-300 focus:border-bs-gold"
                          }`}
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          setErrors((prev) => ({
                            ...prev,
                            startTime: undefined,
                            endTime: undefined,
                          }));
                        }}
                      />
                      {errors.startTime && (
                        <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                          <AlertCircle size={13} /> {errors.startTime}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-bs-neutral-500 tracking-wider">
                        <Clock size={12} /> End Time{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className={`w-full border rounded-xl p-3 outline-none text-bs-neutral-800 transition-all
                          ${
                            errors.endTime
                              ? "border-red-500 focus:border-red-600"
                              : "border-bs-neutral-300 focus:border-bs-gold"
                          }`}
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          setErrors((prev) => ({
                            ...prev,
                            endTime: undefined,
                          }));
                        }}
                      />
                      {errors.endTime && (
                        <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                          <AlertCircle size={13} /> {errors.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* API Submission Error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex gap-4 pt-6 border-t border-bs-neutral-100">
              <button
                type="button"
                onClick={() => navigate("/promotion")}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl border border-bs-neutral-300 text-bs-neutral-700 font-semibold text-sm hover:bg-bs-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-bs-gold hover:bg-[#FFD600] text-bs-neutral-900 font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : initialData ? (
                  "Update Promotion"
                ) : (
                  "Create Promotion"
                )}
              </button>
            </div>
          </div>

          {/* Live Preview (Right Column) */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-bs-neutral-400">
                Live Card Preview
              </h2>

              <div className="p-2 bg-bs-neutral-200/40 rounded-3xl border border-bs-neutral-200 shadow-inner">
                <PromotionCard
                  promotion={currentPromoState}
                  onDelete={() => {}}
                  onEdit={() => {}}
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Note:</strong> What you see here is exactly how your
                  promotion will appear on the interactive search map and
                  restaurant details popups.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* --- AI Planner Modal --- */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-bs-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-bs-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-bs-neutral-900">
                    AI Trend & Campaign Planner
                  </h3>
                  <p className="text-xs text-bs-neutral-500">
                    Powered by Gemini 2.5 Flash & live merchant analytics
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-2 text-bs-neutral-400 hover:text-bs-neutral-700 rounded-xl hover:bg-bs-neutral-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Input & Search Section */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-bs-neutral-700 uppercase tracking-wider">
                Enter Promo Idea, Event, or Dish (Leave empty for general top
                recommendations):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="e.g., Weekend Football Match, Family Bundle, Truffle Burger..."
                  className="flex-1 border border-bs-neutral-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 rounded-xl p-3 text-sm outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleFetchAiRecommendations()}
                  disabled={isAiProcessing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-5 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {isAiProcessing ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Wand2 size={16} />
                  )}
                  {isAiProcessing ? "Generating..." : "Generate Ideas"}
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {aiApiError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                ⚠️ {aiApiError}
              </div>
            )}

            {/* Loading Indicator */}
            {isAiProcessing && (
              <div className="py-12 text-center space-y-3 bg-purple-50/50 rounded-2xl border border-purple-100">
                <RefreshCw
                  size={32}
                  className="animate-spin text-purple-600 mx-auto"
                />
                <p className="text-sm font-semibold text-purple-700">
                  Analyzing sales trends & generating top 3 recommendations...
                </p>
              </div>
            )}

            {/* Display 3 AI Recommendation Cards */}
            {!isAiProcessing && aiRecommendations.length > 0 && (
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-bs-neutral-500">
                  Select a Strategy to Apply (Max 3):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="bg-white border border-bs-neutral-200 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group hover:border-purple-300"
                    >
                      <div className="space-y-2">
                        {rec.event_tag && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            {rec.event_tag}
                          </span>
                        )}

                        <h5 className="font-bold text-sm text-bs-neutral-900 group-hover:text-purple-700 transition-colors">
                          {rec.title}
                        </h5>

                        <p className="text-xs text-bs-neutral-600 line-clamp-3 leading-relaxed">
                          {rec.description}
                        </p>

                        {/* Date & Time metadata */}
                        <div className="pt-2 border-t border-bs-neutral-100 space-y-1 text-[11px] text-bs-neutral-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-purple-500" />
                            <span>
                              {rec.suggested_start_date} to{" "}
                              {rec.suggested_end_date}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-purple-500" />
                            <span>
                              {rec.is_all_day
                                ? "All Day"
                                : `${rec.suggested_start_time} - ${rec.suggested_end_time}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyRecommendation(rec)}
                        className="w-full mt-2 py-2 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200 hover:border-purple-600"
                      >
                        <Check size={14} /> Apply Strategy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
