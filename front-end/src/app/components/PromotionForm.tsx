import { useState } from "react";
import { useNavigate } from "react-router";
import { Megaphone, Calendar, Image, Link } from "lucide-react";
import type { Promotion } from "../types/promotion";

interface PromotionFormProps {
  initialData?: Promotion;
  onSubmit?: (promotion: Promotion) => void;
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
    initialData?.startTime === "" && initialData?.endTime === "",
  );

  const handleSubmit = () => {
    const promotion: Promotion = {
      promoId: initialData?.promoId ?? crypto.randomUUID(),
      id: initialData?.id ?? 1,

      title,
      description,

      imageUrl,
      websiteUrl,

      startDate,
      startTime,

      endDate,
      endTime,

      isAllDay,
    };

    onSubmit?.(promotion);

    navigate("/promotion");
  };

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white border-2 border-bs-neutral-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="text-bs-gold" size={28} />

            <h1 className="text-bs-neutral-900">
              {initialData ? "Edit Promotion" : "Create Promotion"}
            </h1>
          </div>

          <p className="text-bs-neutral-600">
            Create attractive promotions to increase customer engagement and
            restaurant visibility.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border-2 border-bs-neutral-200 rounded-xl p-6 shadow-sm space-y-5">
          {/* Promotion Title */}
          <div>
            <label className="block mb-2 font-medium text-bs-neutral-900">
              Promotion Title
            </label>

            <input
              className="
                w-full
                border-2
                border-bs-neutral-200
                rounded-lg
                p-3
                focus:outline-none
                focus:border-bs-gold
              "
              placeholder="Family Dinner Friday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 font-medium text-bs-neutral-900">
              Description
            </label>

            <textarea
              rows={4}
              className="
                w-full
                border-2
                border-bs-neutral-200
                rounded-lg
                p-3
                focus:outline-none
                focus:border-bs-gold
              "
              placeholder="Describe your promotion..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-medium text-bs-neutral-900">
              <Image size={18} />
              Promotion Image
            </label>

            <input
              className="
                w-full
                border-2
                border-bs-neutral-200
                rounded-lg
                p-3
                focus:outline-none
                focus:border-bs-gold
              "
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-medium text-bs-neutral-900">
              <Link size={18} />
              Website URL
            </label>

            <input
              className="
                w-full
                border-2
                border-bs-neutral-200
                rounded-lg
                p-3
                focus:outline-none
                focus:border-bs-gold
              "
              placeholder="https://..."
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-bs-black" />

              <h3 className="font-semibold text-bs-neutral-900">
                Promotion Duration
              </h3>
            </div>

            {/* Date Range */}
            <div className="mb-6">
              <label className="block mb-3 font-medium text-bs-neutral-900">
                Promotion Date Range
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm text-bs-neutral-600">
                    Start Date
                  </label>

                  <input
                    type="date"
                    className="
            w-full
            border-2
            border-bs-neutral-200
            rounded-lg
            p-3
            focus:outline-none
            focus:border-bs-gold
          "
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-bs-neutral-600">
                    End Date
                  </label>

                  <input
                    type="date"
                    className="
            w-full
            border-2
            border-bs-neutral-200
            rounded-lg
            p-3
            focus:outline-none
            focus:border-bs-gold
          "
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block mb-3 font-medium text-bs-neutral-900">
                Daily Active Time
              </label>

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => {
                    setIsAllDay(e.target.checked);

                    if (e.target.checked) {
                      setStartTime("");
                      setEndTime("");
                    }
                  }}
                  className="h-4 w-4 accent-bs-gold"
                />

                <span className="text-sm font-medium text-bs-neutral-800">
                  Available All Day
                </span>
              </label>

              {!isAllDay && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-bs-neutral-600">
                      Start Time
                    </label>

                    <input
                      type="time"
                      className="
              w-full
              border-2
              border-bs-neutral-200
              rounded-lg
              p-3
              focus:outline-none
              focus:border-bs-gold
            "
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-bs-neutral-600">
                      End Time
                    </label>

                    <input
                      type="time"
                      className="
              w-full
              border-2
              border-bs-neutral-200
              rounded-lg
              p-3
              focus:outline-none
              focus:border-bs-gold
            "
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/promotion")}
              className="
                flex-1
                py-3
                rounded-lg
                border-2
                border-bs-neutral-300
                text-bs-neutral-700
                hover:bg-bs-neutral-100
              "
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="
                flex-1
                py-3
                rounded-lg
                bg-bs-gold
                text-bs-neutral-900
                font-medium
                hover:bg-[#FFE44D]
                transition-colors
              "
            >
              {initialData ? "Update Promotion" : "Create Promotion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
