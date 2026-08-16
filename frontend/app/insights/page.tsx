"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, HelpCircle, X, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BloomieChat } from "@/components/shared/bloomie-chat";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type WeeklySummary = { sleep: number; recovery: number; movement: number; hydration: number; social: number; mindfulness: number; overall: number; trend: string };
type Insight = { id: string; type: string; title: string; body: string };
type WhyExplanation = { question: string; explanation: string; contributing_factors: Array<{ factor: string; detail: string; direction: string }>; context: string | null };

function InsightsPage() {
  const [weekly, setWeekly] = useState<WeeklySummary>({ sleep: 0.8, recovery: 0.7, movement: 0.6, hydration: 0.75, social: 0.5, mindfulness: 0.3, overall: 0.7, trend: "stable" });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [whyModal, setWhyModal] = useState<WhyExplanation | null>(null);
  const [whyLoading, setWhyLoading] = useState(false);
  const [wellnessHistory, setWellnessHistory] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weeklyData, insightsData, historyData] = await Promise.all([
          api.getWeeklySummary(),
          api.getInsights(),
          api.getWellnessData(undefined, "body"),
        ]);
        if (weeklyData) setWeekly(weeklyData as unknown as WeeklySummary);
        if (insightsData) setInsights(insightsData as unknown as Insight[]);
        if (historyData) setWellnessHistory(historyData as Record<string, unknown>[]);
      } catch { /* defaults */ }
    };
    fetchData();
  }, []);

  // Build chart data from wellness history
  const chartData = buildChartData(wellnessHistory);

  const handleWhy = async (observation: string) => {
    setWhyLoading(true);
    try {
      const result = await api.explainWhy(observation);
      setWhyModal(result as unknown as WhyExplanation);
    } catch {
      setWhyModal({ question: observation, explanation: "I don't have enough data yet. Try checking back after a few more days of tracking.", contributing_factors: [], context: "I observe patterns but cannot determine medical causes." });
    } finally { setWhyLoading(false); }
  };

  const trendIcon = weekly.trend === "improving" ? <TrendingUp size={16} /> : weekly.trend === "declining" ? <TrendingDown size={16} /> : <Minus size={16} />;
  const trendColor = weekly.trend === "improving" ? "text-bloom-sage" : weekly.trend === "declining" ? "text-bloom-rose" : "text-bloom-deep/50";

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      <div className="bg-gradient-to-b from-bloom-lavender/20 to-bloom-cream px-6 pt-12 pb-6">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Insights 📊</h1>
          <p className="text-sm text-bloom-deep/60 mt-1">Your patterns, trends, and discoveries</p>
        </BlurFade>
      </div>

      <div className="px-5 space-y-6 max-w-lg mx-auto">
        {/* Weekly Overview with progress bars */}
        <BlurFade delay={0.2}>
          <div className="card-bloom p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">Your Week</h2>
              <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>{trendIcon}<span>{weekly.trend}</span></div>
            </div>
            <div className="space-y-3">
              <ProgressRow emoji="😴" label="Sleep" value={weekly.sleep} color="from-bloom-lavender to-purple-400" />
              <ProgressRow emoji="💚" label="Recovery" value={weekly.recovery} color="from-bloom-sage to-bloom-forest" />
              <ProgressRow emoji="🚶" label="Movement" value={weekly.movement} color="from-bloom-yellow to-amber-400" />
              <ProgressRow emoji="💧" label="Hydration" value={weekly.hydration} color="from-blue-300 to-blue-500" />
              <ProgressRow emoji="💌" label="Social" value={weekly.social} color="from-bloom-peach to-bloom-rose" />
              <ProgressRow emoji="🧘" label="Mindfulness" value={weekly.mindfulness} color="from-bloom-mint to-teal-400" />
            </div>
          </div>
        </BlurFade>

        {/* Sleep Chart */}
        {chartData.sleep.length > 0 && (
          <BlurFade delay={0.25}>
            <div className="card-bloom p-5">
              <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-3">Sleep (hours)</h3>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData.sleep}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C4B1D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C4B1D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#999" }} />
                  <YAxis domain={[4, 10]} tick={{ fontSize: 10, fill: "#999" }} width={25} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#C4B1D4" fill="url(#sleepGrad)" strokeWidth={2} dot={{ fill: "#C4B1D4", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BlurFade>
        )}

        {/* Steps Chart */}
        {chartData.steps.length > 0 && (
          <BlurFade delay={0.3}>
            <div className="card-bloom p-5">
              <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-3">Steps</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData.steps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#999" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#999" }} width={35} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#A8C5A0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BlurFade>
        )}

        {/* Mood Chart */}
        {chartData.mood.length > 0 && (
          <BlurFade delay={0.35}>
            <div className="card-bloom p-5">
              <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-3">Mood (1-10)</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartData.mood}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#999" }} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 10, fill: "#999" }} width={20} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#F5E6A3" strokeWidth={2.5} dot={{ fill: "#F5E6A3", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </BlurFade>
        )}

        {/* What Bloomie Noticed */}
        <BlurFade delay={0.4}>
          <div className="card-bloom p-5 bg-gradient-to-br from-white to-bloom-sage/5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-bloom-sage" />
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">What Bloomie Noticed</h2>
            </div>
            <div className="space-y-3">
              {insights.length === 0 && (
                <>
                  <InsightCard type="trend" title="Keep logging!" body="Log for a few more days and I'll find patterns in your data." onWhy={() => handleWhy("Not enough data yet")} />
                </>
              )}
              {insights.map((insight) => (
                <InsightCard key={insight.id} type={insight.type} title={insight.title} body={insight.body} onWhy={() => handleWhy(insight.body)} />
              ))}
            </div>
          </div>
        </BlurFade>

        {/* Overall Score */}
        <BlurFade delay={0.45}>
          <div className="card-bloom p-5 text-center">
            <p className="text-sm font-bold text-bloom-deep/50 uppercase tracking-wider mb-2">Overall Wellness</p>
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E8E8" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#A8C5A0" strokeWidth="3" strokeDasharray={`${weekly.overall * 100}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-bloom-deep">{Math.round(weekly.overall * 100)}%</span>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>

      {/* Why? Modal */}
      <AnimatePresence>
        {(whyModal || whyLoading) && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !whyLoading && setWhyModal(null)}>
            <motion.div className="card-bloom p-6 max-w-sm w-full" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              {whyLoading ? (
                <div className="text-center py-8">
                  <motion.span className="text-3xl inline-block" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>🌸</motion.span>
                  <p className="text-sm text-bloom-deep/60 mt-3">Bloomie is thinking...</p>
                </div>
              ) : whyModal && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-bloom-deep flex items-center gap-1.5"><HelpCircle size={14} className="text-bloom-lavender" /> Why?</h3>
                    <button onClick={() => setWhyModal(null)} className="p-1 rounded-full hover:bg-bloom-sage/10"><X size={16} className="text-bloom-deep/40" /></button>
                  </div>
                  <p className="text-sm text-bloom-deep/80 leading-relaxed mb-4">{whyModal.explanation}</p>
                  {whyModal.contributing_factors.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {whyModal.contributing_factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-bloom-cream/50 px-3 py-2 rounded-lg">
                          <span className="font-semibold text-bloom-forest">{f.direction}</span>
                          <span className="text-bloom-deep">{f.factor}: {f.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {whyModal.context && <p className="text-[11px] text-bloom-deep/40 italic leading-relaxed border-t border-bloom-sage/10 pt-3">{whyModal.context}</p>}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BloomieChat />
      <BottomNav />
    </main>
  );
}

function ProgressRow({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-6 text-center">{emoji}</span>
      <span className="text-xs font-semibold text-bloom-deep w-20">{label}</span>
      <div className="flex-1 progress-bar">
        <motion.div className={`progress-bar-fill bg-gradient-to-r ${color}`} initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 1, delay: 0.3 }} />
      </div>
      <span className="text-xs font-bold text-bloom-deep w-10 text-right">{Math.round(value * 100)}%</span>
    </div>
  );
}

function InsightCard({ type, title, body, onWhy }: { type: string; title: string; body: string; onWhy: () => void }) {
  const typeColors: Record<string, string> = { pattern: "bg-bloom-lavender/15 border-bloom-lavender/30", correlation: "bg-bloom-sky/15 border-bloom-sky/30", trend: "bg-bloom-yellow/15 border-bloom-yellow/30", suggestion: "bg-bloom-mint/15 border-bloom-mint/30", celebration: "bg-bloom-sage/15 border-bloom-sage/30" };
  const typeEmoji: Record<string, string> = { pattern: "🔄", correlation: "🔗", trend: "📈", suggestion: "💡", celebration: "🎉" };

  return (
    <div className={`p-3 rounded-xl border ${typeColors[type] || "bg-white border-bloom-sage/10"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">{typeEmoji[type] || "🌱"}</span>
            <span className="text-xs font-bold text-bloom-deep">{title}</span>
          </div>
          <p className="text-xs text-bloom-deep/70 leading-relaxed">{body}</p>
        </div>
        <button onClick={onWhy} className="flex-shrink-0 px-2 py-1 rounded-lg bg-white/60 border border-bloom-lavender/20 text-[10px] font-bold text-bloom-lavender hover:bg-bloom-lavender/10 transition-colors">Why?</button>
      </div>
    </div>
  );
}

function buildChartData(history: Record<string, unknown>[]) {
  const sleepData: { day: string; value: number }[] = [];
  const stepsData: { day: string; value: number }[] = [];
  const moodData: { day: string; value: number }[] = [];

  // Group by day and metric
  const byDay: Record<string, Record<string, number>> = {};

  for (const entry of history) {
    const date = (entry.recorded_at as string || "").slice(0, 10);
    const metric = entry.metric as string;
    const value = entry.value as Record<string, number>;
    if (!date || !metric) continue;

    if (!byDay[date]) byDay[date] = {};

    if (metric === "sleep" && value?.hours) byDay[date].sleep = value.hours;
    if (metric === "steps" && value?.count) byDay[date].steps = value.count;
    if (metric === "mood" && value?.score) byDay[date].mood = value.score;
  }

  const days = Object.keys(byDay).sort().slice(-7);
  for (const day of days) {
    const label = day.slice(5); // MM-DD
    if (byDay[day].sleep) sleepData.push({ day: label, value: byDay[day].sleep });
    if (byDay[day].steps) stepsData.push({ day: label, value: byDay[day].steps });
    if (byDay[day].mood) moodData.push({ day: label, value: byDay[day].mood });
  }

  return { sleep: sleepData, steps: stepsData, mood: moodData };
}

export default InsightsPage;
