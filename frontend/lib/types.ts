/** Bloomie TypeScript types - mirrors backend Pydantic models */

export type WellnessCategory = "body" | "habits" | "self_report" | "environment" | "life_context" | "social";

export type WellnessData = {
  id: string;
  user_id: string;
  category: WellnessCategory;
  metric: string;
  value: Record<string, unknown>;
  source: string;
  recorded_at: string;
};

export type GardenState = {
  sky: "clear" | "cloudy" | "stormy" | "sunset" | "night";
  pond_level: number;
  tree_growth: number;
  butterfly_count: number;
  bird_count: number;
  firefly_count: number;
  flower_bloom: number;
  rabbit_mood: "happy" | "sleepy" | "playful" | "cozy";
};

export type Deviation = {
  metric: string;
  direction: "up" | "down";
  magnitude: number;
  description: string;
};

export type Assessment = {
  id: string;
  user_id: string;
  overall_score: number;
  deviation_level: "none" | "mild" | "moderate" | "significant";
  narrative: string | null;
  insights: string[];
  garden_state: GardenState | null;
  deviations: Deviation[];
  recommendations: string[];
  created_at: string | null;
};

export type QuestType = "hydration" | "movement" | "connection" | "sleep" | "recovery" | "kindness" | "mindfulness" | "nutrition";
export type QuestStatus = "active" | "completed" | "expired";

export type Quest = {
  id: string;
  user_id: string;
  type: QuestType;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  reward: string;
  status: QuestStatus;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export type NestContact = {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  emoji: string;
  phone: string | null;
  email: string | null;
  last_contact_at: string | null;
  contact_frequency_days: number;
  created_at: string | null;
};

export type Insight = {
  id: string;
  user_id: string;
  type: "pattern" | "correlation" | "trend" | "suggestion" | "celebration";
  title: string;
  body: string;
  related_metrics: string[];
  confidence: number;
  acknowledged: boolean;
  created_at: string | null;
};

export type TodaySummary = {
  user_name: string;
  greeting: string;
  body_stats: Record<string, Record<string, unknown>>;
  bloomie_thought: string;
  active_quests: Quest[];
  garden_state: GardenState;
  streak_days: number;
};

export type WeeklySummary = {
  sleep: number;
  recovery: number;
  movement: number;
  hydration: number;
  social: number;
  mindfulness: number;
  overall: number;
  trend: "improving" | "stable" | "declining";
};

export type WhyExplanation = {
  question: string;
  explanation: string;
  contributing_factors: Array<{ factor: string; detail: string; direction: string }>;
  context: string | null;
};

export type FamilyView = {
  status: "green" | "yellow" | "red";
  summary: string;
  categories: Record<string, string>;
  needs_attention: boolean;
  overall_score?: number;
};

export type TimeOfDay = "day" | "sunset" | "night";
