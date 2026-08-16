const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 15000;

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
  // Health
  health: () => request<{ status: string }>("/health"),

  // Wellness data
  postWellnessData: (data: { category: string; metric: string; value: Record<string, unknown>; source?: string }, userId = "demo") =>
    request(`/api/wellness?user_id=${userId}`, { method: "POST", body: data, timeout: 30000 }),

  getWellnessData: (userId = "demo", category?: string, metric?: string) => {
    let path = `/api/wellness?user_id=${userId}`;
    if (category) path += `&category=${category}`;
    if (metric) path += `&metric=${metric}`;
    return request<Record<string, unknown>[]>(path);
  },

  // Today
  getToday: (userId = "demo") => request<Record<string, unknown>>(`/api/today?user_id=${userId}`),

  // Insights
  getInsights: (userId = "demo") => request<Record<string, unknown>[]>(`/api/insights?user_id=${userId}`),
  getWeeklySummary: (userId = "demo") => request<Record<string, unknown>>(`/api/insights/weekly?user_id=${userId}`),
  explainWhy: (observation: string, userId = "demo") =>
    request(`/api/insights/why?user_id=${userId}`, { method: "POST", body: observation, timeout: 20000 }),

  // Nest
  getNestContacts: (userId = "demo") => request<Record<string, unknown>[]>(`/api/nest/contacts?user_id=${userId}`),
  addNestContact: (data: Record<string, unknown>, userId = "demo") =>
    request(`/api/nest/contacts?user_id=${userId}`, { method: "POST", body: data }),
  checkInContact: (contactId: string) =>
    request(`/api/nest/contacts/${contactId}/checkin`, { method: "PUT" }),
  getFamilyView: (userId = "demo") => request<Record<string, unknown>>(`/api/nest/family-view?user_id=${userId}`),

  // Quests
  getQuests: (userId = "demo") => request<Record<string, unknown>[]>(`/api/quests?user_id=${userId}`),
  generateQuests: (userId = "demo") =>
    request<Record<string, unknown>[]>(`/api/quests/generate?user_id=${userId}`, { method: "POST" }),
  updateQuestProgress: (questId: string, progress: number) =>
    request(`/api/quests/${questId}/progress`, { method: "POST", body: { progress } }),

  // Chat
  chat: (message: string, userName = "friend", userId = "demo") =>
    request<{ reply: string; emotion: string }>(`/api/chat?user_id=${userId}`, { method: "POST", body: { message, user_name: userName }, timeout: 20000 }),

  // Weather
  getWeather: (lat?: number, lon?: number) => {
    let path = "/api/weather";
    if (lat && lon) path += `?lat=${lat}&lon=${lon}`;
    return request<Record<string, unknown>>(path);
  },

  // Calendar
  getCalendar: (userId = "demo") => request<Record<string, unknown>>(`/api/calendar?user_id=${userId}`),
  addWellnessBreak: (breakTime: string, activity: string, userId = "demo") =>
    request(`/api/calendar/breaks/add?user_id=${userId}`, { method: "POST", body: { break_time: breakTime, activity } }),

  // Nutrition
  logFood: (entry: Record<string, unknown>, userId = "demo") =>
    request(`/api/nutrition/log?user_id=${userId}`, { method: "POST", body: entry }),
  getNutritionSummary: (userId = "demo") => request<Record<string, unknown>>(`/api/nutrition/summary?user_id=${userId}`),

  // Caffeine
  getCaffeineSummary: (userId = "demo") => request<Record<string, unknown>>(`/api/caffeine?user_id=${userId}`),
  logCaffeine: (mg: number, drinkType: string, userId = "demo") =>
    request(`/api/caffeine/log?user_id=${userId}&mg=${mg}&drink_type=${drinkType}`, { method: "POST" }),

  // Spotify
  getWellnessMoments: (mood = "calm", weather = "clear", timeOfDay = "day") =>
    request<Record<string, unknown>>(`/api/spotify/moments?mood=${mood}&weather=${weather}&time_of_day=${timeOfDay}`),
  getPlaylists: () => request<Record<string, unknown>>("/api/spotify/playlists"),

  // Ecosystem
  getEcosystem: (userId = "demo") => request<Record<string, unknown>>(`/api/ecosystem?user_id=${userId}`),
  getAchievements: (userId = "demo") => request<Record<string, unknown>>(`/api/ecosystem/achievements?user_id=${userId}`),

  // Clinical
  getPatientTimeline: (userId = "demo", days = 7) =>
    request<Record<string, unknown>>(`/api/clinical/timeline?user_id=${userId}&days=${days}`),
  getClinicalAlerts: (userId = "demo") => request<Record<string, unknown>>(`/api/clinical/alerts?user_id=${userId}`),

  // Privacy
  getPrivacySettings: (userId = "demo") => request<Record<string, unknown>>(`/api/privacy?user_id=${userId}`),
  updatePrivacy: (metric: string, audience: string, allowed: boolean, userId = "demo") =>
    request(`/api/privacy?user_id=${userId}`, { method: "PUT", body: { metric, audience, allowed } }),
  getAuditLog: (userId = "demo") => request<Record<string, unknown>>(`/api/privacy/audit-log?user_id=${userId}`),
};
