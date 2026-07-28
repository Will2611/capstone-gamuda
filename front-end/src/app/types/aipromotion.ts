export interface AIPromotionRecommendation {
  title: string;
  description: string;
  event_tag?: string;
  suggested_start_date: string;
  suggested_end_date: string;
  suggested_start_time?: string;
  suggested_end_time?: string;
  is_all_day: boolean;
  suggested_image_url?: string;
}
