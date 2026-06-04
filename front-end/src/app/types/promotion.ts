export interface Promotion {
  promoId: string;
  id: number; //restaurant id
  title: string;
  description: string;

  imageUrl: string;
  websiteUrl: string;

  startDate: string;
  startTime: string;

  endDate: string;
  endTime: string;

  isAllDay: boolean;
}
