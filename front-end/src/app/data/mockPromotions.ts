// data/promotions.ts

import type { Promotion } from "../types/promotion";

export const mockPromotions: Promotion[] = [
  {
    promoId: "promo1",
    id: "1",
    title: "50% Buffet Discount",
    description: "Enjoy 50% off all buffet packages every weekend.",
    imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9",
    websiteUrl: "https://restaurant.com/buffet",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    startTime: "",
    endTime: "",
    isAllDay: true,
  },

  {
    promoId: "promo2",
    id: "1",
    title: "Free Dessert",
    description: "Get a free dessert with every main course.",
    imageUrl:
      "https://static.vecteezy.com/system/resources/thumbnails/037/975/849/small_2x/ai-generated-semifreddo-originating-in-italy-semifreddo-is-a-frozen-dessert-similar-to-ice-cream-but-with-a-lighter-texture-often-flavored-with-fruits-nuts-or-chocolate-free-photo.jpg",
    websiteUrl: "https://restaurant.com/dessert",
    startDate: "2026-05-01",
    endDate: "2026-05-15",
    startTime: "18:00",
    endTime: "21:00",
    isAllDay: false,
  },

  {
    promoId: "promo3",
    id: "1",
    title: "National Day Special",
    description: "Enjoy discounts throughout the holiday week.",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    websiteUrl: "https://restaurant.com/national-day",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    startTime: "",
    endTime: "",
    isAllDay: true,
  },
  {
    promoId: "promo4",
    id: "2",
    title: "June Feast Festival",
    description:
      "Celebrate June with exclusive dining deals and special offers all month long.",
    imageUrl:
      "https://tse4.mm.bing.net/th/id/OIP.paZokRr6HFdXZQoIAKmDjgHaEK?pid=Api&P=0&h=180",
    websiteUrl: "https://restaurant.com/june-feast-festival",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    startTime: "",
    endTime: "",
    isAllDay: true,
  },
];
