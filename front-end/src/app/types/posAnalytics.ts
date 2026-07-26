// types/posAnalytics.ts
import type { Promotion } from "./promotion";

// 扩展后的 Promotion，增加了历史效果指标 (ROI / 转化率)
export interface HistoricalPromotion extends Promotion {
    performanceMetrics?: {
        totalRedemptions: number;
        revenueGenerated: number;
        roiPercentage: number;
        impactNote: string; // AI 用于总结以往活动好坏的依据
    };
}

export interface MonthlySales {
    month: string;
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMarginPct: number;
    totalOrders: number;
    avgOrderValue: number;
}

export interface MenuItemPerformance {
    itemId: string;
    name: string;
    category: "Mains" | "Sides" | "Beverages" | "Desserts" | "Appetizers";
    unitsSold: number;
    revenue: number;
    profitMarginPct: number;
    reason?: string;
}

export interface CustomerTrend {
    averageSpendPerPax: number;
    averagePartySize: number;
    peakHours: { dayRange: string; timeSlot: string; avgOccupancyPct: number }[];
    slowHours: { dayRange: string; timeSlot: string; avgOccupancyPct: number }[];
    customerBreakdown: {
        returningCustomersPct: number;
        newCustomersPct: number;
        avgDaysBetweenVisits: number;
    };
}

export interface UpcomingEvent {
    eventName: string;
    date: string;
    type: string;
    expectedTrafficImpact: string;
}

// 汇总传给 AI 的 POS 完整数据接口
export interface POSAnalyticsMockData {
    restaurantId: string;
    restaurantName: string;
    cuisineType: string;
    currency: string;
    salesSummary: MonthlySales[];
    topSellingItems: MenuItemPerformance[];
    underperformingItems: MenuItemPerformance[];
    customerTrends: CustomerTrend;
    historicalPromotions: HistoricalPromotion[];
    upcomingEvents: UpcomingEvent[];
}