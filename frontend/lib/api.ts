const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const TIMEOUT_MS = 15000;

/** Get the current user ID from cookie, or "demo" as fallback */
function getCurrentUserId(): string {
  if (typeof document === "undefined") return "demo";
  const match = document.cookie.match(/bloomie_user=([^;]+)/);
  if (!match) return "demo";
  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    return user.id || "demo";
  } catch {
    return "demo";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error("No API URL configured");
  }

  const { method = "GET", body, headers = {}, timeout = TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // Auth
  signup: (name: string, email: string, password: string) =>
    request<{ id: string; email: string; name: string; garden_level: number; streak_days: number; is_new: boolean }>("/api/auth/signup", { method: "POST", body: { name, email, password } }),

  login: (email: string, password: string) =>
    request<{ id: string; email: string; name: string; garden_level: number; streak_days: number; is_new: boolean }>("/api/auth/login", { method: "POST", body: { email, password } }),

  // Health
  health: () => request<{ status: string }>("/health"),

  // Wellness data
  postWellnessData: (data: { category: string; metric: string; value: Record<string, unknown>; source?: string }, userId?: string) =>
    request(`/api/wellness?user_id=${userId || getCurrentUserId()}`, { method: "POST", body: data, timeout: 30000 }),

  getWellnessData: (userId?: string, category?: string, metric?: string) => {
    const uid = userId || getCurrentUserId();
    let path = `/api/wellness?user_id=${uid}`;
    if (category) path += `&category=${category}`;
    if (metric) path += `&metric=${metric}`;
    return request<Record<string, unknown>[]>(path);
  },

  // Today
  getToday: (userId?: string) => request<Record<string, unknown>>(`/api/today?user_id=${userId || getCurrentUserId()}`),

  // Insights
  getInsights: (userId?: string) => request<Record<string, unknown>[]>(`/api/insights?user_id=${userId || getCurrentUserId()}`),
  getWeeklySummary: (userId?: string) => request<Record<string, unknown>>(`/api/insights/weekly?user_id=${userId || getCurrentUserId()}`),
  explainWhy: (observation: string, userId?: string) =>
    request(`/api/insights/why?user_id=${userId || getCurrentUserId()}`, { method: "POST", body: observation, timeout: 20000 }),

  // Nest
  getNestContacts: (userId?: string) => request<Record<string, unknown>[]>(`/api/nest/contacts?user_id=${userId || getCurrentUserId()}`),
  addNestContact: (data: Record<string, unknown>, userId?: string) =>
    request(`/api/nest/contacts?user_id=${userId || getCurrentUserId()}`, { method: "POST", body: data }),
  checkInContact: (contactId: string) =>
    request(`/api/nest/contacts/${contactId}/checkin`, { method: "PUT" }),
  getFamilyView: (userId?: string) => request<Record<string, unknown>>(`/api/nest/family-view?user_id=${userId || getCurrentUserId()}`),

  // Quests
  getQuests: (userId?: string) => request<Record<string, unknown>[]>(`/api/quests?user_id=${userId || getCurrentUserId()}`),
  generateQuests: (userId?: string) =>
    request<Record<string, unknown>[]>(`/api/quests/generate?user_id=${userId || getCurrentUserId()}`, { method: "POST" }),
  updateQuestProgress: (questId: string, progress: number) =>
    request(`/api/quests/${questId}/progress`, { method: "POST", body: { progress } }),

  // Chat
  chat: (message: string, userName = "friend", userId?: string) =>
    request<{ reply: string; emotion: string }>(`/api/chat?user_id=${userId || getCurrentUserId()}`, { method: "POST", body: { message, user_name: userName }, timeout: 20000 }),

  // Weather
  getWeather: (lat?: number, lon?: number) => {
    let path = "/api/weather";
    if (lat && lon) path += `?lat=${lat}&lon=${lon}`;
    return request<Record<string, unknown>>(path);
  },

  // Calendar
  getCalendar: (userId?: string) => request<Record<string, unknown>>(`/api/calendar?user_id=${userId || getCurrentUserId()}`),
  addWellnessBreak: (breakTime: string, activity: string, userId?: string) =>
    request(`/api/calendar/breaks/add?user_id=${userId || getCurrentUserId()}`, { method: "POST", body: { break_time: breakTime, activity } }),

  // Nutrition
  logFood: (entry: Record<string, unknown>, userId?: string) =>
    request(`/api/nutrition/log?user_id=${userId || getCurrentUserId()}`, { method: "POST", body: entry }),
  getNutritionSummary: (userId?: string) => request<Record<string, unknown>>(`/api/nutrition/summary?user_id=${userId || getCurrentUserId()}`),

  // Caffeine
  getCaffeineSummary: (userId?: string) => request<Record<string, unknown>>(`/api/caffeine?user_id=${userId || getCurrentUserId()}`),
  logCaffeine: (mg: number, drinkType: string, userId?: string) =>
    request(`/api/caffeine/log?user_id=${userId || getCurrentUserId()}&mg=${mg}&drink_type=${drinkType}`, { method: "POST" }),

  // Spotify
  getWellnessMoments: (mood = "calm", weather = "clear", timeOfDay = "day") =>
    request<Record<string, unknown>>(`/api/spotify/moments?mood=${mood}&weather=${weather}&time_of_day=${timeOfDay}`),
  getPlaylists: () => request<Record<string, unknown>>("/api/spotify/playlists"),

  // Ecosystem
  getEcosystem: (userId?: string) => request<Record<string, unknown>>(`/api/ecosystem?user_id=${userId || getCurrentUserId()}`),
  getAchievements: (userId?: string) => request<Record<string, unknown>>(`/api/ecosystem/achievements?user_id=${userId || getCurrentUserId()}`),

  // Clinical
  getPatientTimeline: (userId?: string, days = 7) =>
    request<Record<string, unknown>>(`/api/clinical/timeline?user_id=${userId || getCurrentUserId()}&days=${days}`),
  getClinicalAlerts: (userId?: string) => request<Record<string, unknown>>(`/api/clinical/alerts?user_id=${userId || getCurrentUserId()}`),

  // Privacy
  getPrivacySettings: (userId?: string) => request<Record<string, unknown>>(`/api/privacy?user_id=${userId || getCurrentUserId()}`),
  updatePrivacy: (metric: string, audience: string, allowed: boolean, userId?: string) =>
    request(`/api/privacy?user_id=${userId || getCurrentUserId()}`, { method: "PUT", body: { metric, audience, allowed } }),
  getAuditLog: (userId?: string) => request<Record<string, unknown>>(`/api/privacy/audit-log?user_id=${userId || getCurrentUserId()}`),
};
