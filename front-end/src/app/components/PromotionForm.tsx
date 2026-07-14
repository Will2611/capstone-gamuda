import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Megaphone,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  Upload,
  AlertCircle, // Used for validation error icons
} from "lucide-react";
import type { Promotion } from "../types/promotion";
import { PromotionCard } from "./PromotionCard";
import { mockPromotions } from "../data/mockPromotions";

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

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
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

  // Error tracking state
  const [errors, setErrors] = useState<FormErrors>({});

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
          // Clear error dynamically when field is populated
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

  const handleSubmit = () => {
    // Prevent execution if validation fails
    if (!validateForm()) {
      return;
    }

    const promotion: Promotion = {
      promoId: initialData?.promoId ?? crypto.randomUUID(),
      id: initialData?.id ?? 1,

      title: title.trim(),
      description: description.trim(),

      imageUrl: imageUrl.trim(),
      websiteUrl: websiteUrl.trim(),

      startDate,
      startTime: isAllDay ? "" : startTime,

      endDate,
      endTime: isAllDay ? "" : endTime,

      isAllDay,
    };

    if (initialData) {
      const idx = mockPromotions.findIndex(
        (p) => p.promoId === initialData.promoId,
      );
      if (idx !== -1) {
        mockPromotions[idx] = promotion;
      }
    } else {
      mockPromotions.push(promotion);
    }

    onSubmit?.(promotion);
    navigate("/promotion");
  };

  const currentPromoState: Promotion = {
    promoId: initialData?.promoId ?? "preview-id",
    id: initialData?.id ?? 1,
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

  return (
    <div className="min-h-screen bg-bs-neutral-100/60 py-10 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Block */}
        <div className="bg-white border border-bs-neutral-200/80 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-3.5 mb-2">
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
        </div>

        {/* Dynamic Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Controls (Left Column) */}
          <div className="lg:col-span-7 bg-white border border-bs-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Title */}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-bs-neutral-800">
                Promotion Title <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full border rounded-xl p-3 outline-none text-bs-neutral-800 transition-all placeholder:text-bs-neutral-400
                  ${
                    errors.title
                      ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/10"
                      : "border-bs-neutral-300 hover:border-bs-neutral-400 focus:border-bs-gold focus:ring-2 focus:ring-bs-gold/20"
                  }`}
                placeholder="e.g. Weekend Family Buffet Discount"
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

            {/* Description */}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-bs-neutral-800">
                Description <span className="text-red-500">*</span>
              </label>
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
                <Upload size={16} className="text-bs-neutral-500" />
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
                        Image Loaded Successfully
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
                      className={`p-3 bg-white border rounded-xl inline-block shadow-sm ${errors.imageUrl ? "text-red-500 border-red-200" : "text-bs-neutral-500 border-bs-neutral-200"}`}
                    >
                      <Upload size={22} />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${errors.imageUrl ? "text-red-700" : "text-bs-neutral-800"}`}
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
                      ${errors.startDate ? "border-red-500 focus:border-red-600" : "border-bs-neutral-300 focus:border-bs-gold"}`}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (errors.startDate)
                        setErrors((prev) => ({
                          ...prev,
                          startDate: undefined,
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
                      ${errors.endDate ? "border-red-500 focus:border-red-600" : "border-bs-neutral-300 focus:border-bs-gold"}`}
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (errors.endDate)
                        setErrors((prev) => ({ ...prev, endDate: undefined }));
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
                          ${errors.startTime ? "border-red-500 focus:border-red-600" : "border-bs-neutral-300 focus:border-bs-gold"}`}
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          if (errors.startTime)
                            setErrors((prev) => ({
                              ...prev,
                              startTime: undefined,
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
                          ${errors.endTime ? "border-red-500 focus:border-red-600" : "border-bs-neutral-300 focus:border-bs-gold"}`}
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          if (errors.endTime)
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

            {/* Submission Actions */}
            <div className="flex gap-4 pt-6 border-t border-bs-neutral-100">
              <button
                type="button"
                onClick={() => navigate("/promotion")}
                className="flex-1 py-3 px-4 rounded-xl border border-bs-neutral-300 text-bs-neutral-700 font-semibold text-sm hover:bg-bs-neutral-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-bs-gold hover:bg-[#FFD600] text-bs-neutral-900 font-semibold text-sm shadow-sm hover:shadow transition-all"
              >
                {initialData ? "Update Promotion" : "Create Promotion"}
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
        </div>
      </div>
    </div>
  );
}
