export interface MeetingAvailability {
  name: string;
  weekdayOrWeekend: 'weekday' | 'weekend';
  days: string[];
  time: string;
}

export interface DayTimeCombo {
  id: string;       // Format: "Day@Time" (e.g. "Monday@21:00")
  name: string;     // Friendly name (e.g. "Monday at 21:00")
  day: string;      // Day component
  time: string;     // Time component
  count: number;    // Number of people available at this time
  people: string[]; // Names of people available at this time
}

export interface AnalyticsData {
  dayStats: { name: string; value: number }[];
  timeStats: { name: string; value: number }[];
  weekdayStats: { name: string; value: number }[];
  mostCommonTime: string;
  mostCommonWeekday: string;
  dayTimeCombos: DayTimeCombo[];
  suggestedMeetingTime: DayTimeCombo | null;
  top3MeetingTimes: DayTimeCombo[];
}

export interface FinalVote {
  name: string;
  available_day: string;
  unavailable_day: string;
}

export interface VoteCount {
  available: number;
  unavailable: number;
}

export interface DayVoteStats {
  [key: string]: VoteCount;
}

export interface VoteResults {
  name: string;
  availableDay: string;
  unavailableDay: string;
}