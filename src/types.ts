export interface MeetingAvailability {
  name: string;
  weekdayOrWeekend: 'weekday' | 'weekend';
  days: string[];
  time: string;
}

export interface AnalyticsData {
  dayStats: { name: string; value: number }[];
  timeStats: { name: string; value: number }[];
  weekdayStats: { name: string; value: number }[];
  mostCommonTime: string;
  mostCommonWeekday: string;
}