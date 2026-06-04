import type { Promotion } from "../types/promotion";

export function isPromotionActive(promotion: Promotion) {
  const now = new Date();

  const today = now.toLocaleDateString("en-CA");

  const withinDateRange =
    today >= promotion.startDate && today <= promotion.endDate;

  if (!withinDateRange) {
    return false;
  }

  if (promotion.isAllDay) {
    return true;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = promotion.startTime.split(":").map(Number);

  const [endHour, endMinute] = promotion.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;

  const endMinutes = endHour * 60 + endMinute;

  return currentMinutes >= startMinutes - 60 && currentMinutes <= endMinutes;
}
