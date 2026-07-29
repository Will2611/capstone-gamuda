import type { Promotion } from "../types/promotion";

export function normalizePromotion(raw: any): Promotion {
  const promoId = raw.promoId || raw.promo_id || raw.id || "";
  const restaurantId =
    raw.restaurantId || raw.restaurant_id || raw.restaurant_uuid || "";

  return {
    promoId,
    id: restaurantId,
    title: raw.title || "Special Promotion",
    description: raw.description || "",
    imageUrl:
      raw.imageUrl ||
      raw.image_url ||
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop",
    websiteUrl: raw.websiteUrl || raw.website_url || "",
    startDate: raw.startDate || raw.start_date || "",
    endDate: raw.endDate || raw.end_date || "",
    startTime: raw.startTime || raw.start_time || "",
    endTime: raw.endTime || raw.end_time || "",
    isAllDay: raw.isAllDay ?? raw.is_all_day ?? true,
    status: raw.status || "ACTIVE",
  };
}

export function isPromotionActive(promotion: Promotion) {
  const norm = normalizePromotion(promotion);

  if (norm.status && norm.status.toUpperCase() !== "ACTIVE") {
    return false;
  }

  const now = new Date();
  const today = now.toLocaleDateString("en-CA"); // YYYY-MM-DD

  if (norm.startDate && norm.endDate) {
    const withinDateRange = today >= norm.startDate && today <= norm.endDate;
    if (!withinDateRange) {
      return false;
    }
  }

  if (norm.isAllDay || !norm.startTime || !norm.endTime) {
    return true;
  }

  try {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startHour = 0, startMinute = 0] = norm.startTime.split(":").map(Number);
    const [endHour = 23, endMinute = 59] = norm.endTime.split(":").map(Number);

    if (!isNaN(startHour) && !isNaN(endHour)) {
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      return currentMinutes >= startMinutes - 60 && currentMinutes <= endMinutes;
    }
  } catch {
    return true;
  }

  return true;
}

