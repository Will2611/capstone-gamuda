export interface Promotion {
  promoId: string;
  id: string; //restaurant id
  title: string;
  description: string;

  imageUrl: string;
  websiteUrl: string;

  startDate: string;
  startTime: string;

  endDate: string;
  endTime: string;

  isAllDay: boolean;
  status?: string;
}
