"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Brain, Battery, Clock, Moon, Sun, Activity, Zap } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getCurrentUserId(): string {
  if (typeof document === "undefined") return "demo";
  const match = document.cookie.match(/bloomie_user=([^;]+)/);
  if (!match) return "demo";
  try { return JSON.parse(decodeURIComponent(match[1])).id || "demo"; } catch { return "demo"; }
}

function SmartCheckinPage() {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedMetrics, setExtractedMetrics] = useState<Record<string, unknown> | null>(null);
  const [bloomieResponse, setBloomieResponse] = useState("");
  const [wellnessScore, setWellnessScore] = useState<Record<string, unknown> | null>(null);
  const [dailyPlan, setDailyPlan] = useState<Record<string, unknown> | null>(null);
  const [chronotype, setChronotype] = useState<Record<string, unknown> | null>(null);
  const [bodyBattery, setBodyBattery] = useState<Record<string, unknown> | null>(null);
  const [socialJetlag, setSocialJetlag] = useState<Record<string, unknown> | null>(null);

  // Load science data
  useEffect(() => {
    const loadData = async () => {
      if (!API_URL) return;
      const uid = getCurrentUserId();
      try {
        const [score, plan, chrono, battery, jetlag] = await Promise.all([
          fetch(`${API_URL}/api/science/wellness-score?user_id=${uid}`).then((r) => r.json()),
          fetch(`${API_URL}/api/science/daily-plan?user_id=${uid}`).then((r) => r.json()),
          fetch(`${API_URL}/api/science/chronotype?user_id=${uid}`).then((r) => r.json()),
          fetch(`${API_URL}/api/science/body-battery?user_id=${uid}`).then((r) => r.json()),
          fetch(`${API_URL}/api/science/social-jetlag?user_id=${uid}`).then((r) => r.json()),
        ]);
        setWellnessScore(score);
        setDailyPlan(plan);
        setChronotype(chrono);
        setBodyBattery(battery);
        setSocialJetlag(jetlag);
      } catch { /* fallback defaults */ }
    };
    loadData();
  }, []);

  // Voice recognition
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    const recognition = new (SpeechRecognition as new () => { lang: string; continuous: boolean; onresult: (e: { results: { transcript: string }[][] }) => void; onend: () => void; start: () => void })();
    recognition.lang = "en-US";
    recognition.continuous = false;
    setIsListening(true);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, []);

  // Submit check-in
  const handleSubmit = useCallback(async () => {
    if (!text.trim() || !API_URL) return;
    setIsProcessing(true);

    try {
      const uid = getCurrentUserId();
      const res = await fetch(`${API_URL}/api/science/checkin?user_id=${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), user_name: "friend" }),
      });
      const data = await res.json();
      setExtractedMetrics(data.extracted_metrics);
      setBloomieResponse(data.bloomie_response || "Check-in received! 🌱");

      // Refresh wellness score
      const scoreRes = await fetch(`${API_URL}/api/science/wellness-score?user_id=${uid}`);
      setWellnessScore(await scoreRes.json());
    } catch {
      setBloomieResponse("Check-in saved! Your garden is growing. 🌸");
    } finally {
      setIsProcessing(false);
    }
  }, [text]);

  const score = (wellnessScore as { score?: number })?.score ?? 72;
  const batteryLevel = (bodyBattery as { battery_level?: number })?.battery_level ?? 65;

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-deep/5 via-bloom-cream to-bloom-mint/10 pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Smart Check-in 🧠</h1>
          <p className="text-sm text-bloom-deep/50 mt-1">Speak naturally or type. AI extracts your metrics.</p>
        </BlurFade>
      </div>

      <div className="px-5 max-w-lg mx-auto space-y-5">
        {/* Voice/Text Input */}
        <BlurFade delay={0.15}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-bloom-lavender" />
              <p className="text-xs font-bold text-bloom-deep/50 uppercase tracking-wider">Natural Language Check-in</p>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='e.g. "I slept 7 hours, feeling good energy but a bit stressed. Had 2 coffees and walked 6000 steps."'
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-bloom-cream/50 border border-bloom-sage/15 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bloom-lavender/30 leading-relaxed mb-3"
            />
            <div className="flex items-center gap-2">
              <motion.button
                onClick={startListening}
                className={`p-3 rounded-full transition-all ${isListening ? "bg-red-100 text-red-500 animate-pulse" : "bg-bloom-lavender/20 text-bloom-lavender hover:bg-bloom-lavender/30"}`}
                whileTap={{ scale: 0.9 }}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                disabled={!text.trim() || isProcessing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-bloom-lavender to-bloom-dusk text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Send size={14} /> Analyze & Log</>
                )}
              </motion.button>
            </div>
            {isListening && <p className="text-xs text-red-500 mt-2 animate-pulse">🎙️ Listening... speak naturally</p>}
          </div>
        </BlurFade>

        {/* Extracted Metrics Display */}
        <AnimatePresence>
          {extractedMetrics && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-bloom p-5 bg-gradient-to-br from-white to-bloom-lavender/5">
              <p className="text-xs font-bold text-bloom-deep/50 uppercase tracking-wider mb-3">AI Extracted Metrics</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(extractedMetrics).filter(([, v]) => v !== null).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bloom-cream/50">
                    <span className="text-sm">{metricEmoji(key)}</span>
                    <div>
                      <p className="text-[10px] text-bloom-deep/40 capitalize">{key.replace("_", " ")}</p>
                      <p className="text-xs font-bold text-bloom-deep">{String(value)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {bloomieResponse && <p className="text-sm text-bloom-forest mt-3 font-medium">🌸 {bloomieResponse}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wellness Score + Body Battery Row */}
        <BlurFade delay={0.2}>
          <div className="grid grid-cols-2 gap-3">
            {/* Wellness Score */}
            <div className="card-bloom p-4 text-center">
              <p className="text-[10px] font-bold text-bloom-deep/40 uppercase tracking-wider mb-2">Wellness Score</p>
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#E8E8E8" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke={score >= 70 ? "#5B8C5A" : score >= 50 ? "#F5E6A3" : "#F4A7BB"} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-bloom-deep">{score}</span>
                </div>
              </div>
              <p className="text-[10px] text-bloom-deep/40 mt-1">{(wellnessScore as { trend?: string })?.trend || "stable"}</p>
            </div>

            {/* Body Battery */}
            <div className="card-bloom p-4 text-center">
              <p className="text-[10px] font-bold text-bloom-deep/40 uppercase tracking-wider mb-2">Body Battery</p>
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <Battery size={32} className={batteryLevel >= 60 ? "text-bloom-sage" : batteryLevel >= 30 ? "text-bloom-yellow" : "text-bloom-rose"} />
              </div>
              <p className="text-lg font-bold text-bloom-deep">{batteryLevel}%</p>
              <p className="text-[10px] text-bloom-deep/40">{(bodyBattery as { status?: string })?.status || "stable"}</p>
            </div>
          </div>
        </BlurFade>

        {/* Chronotype + Social Jet Lag */}
        <BlurFade delay={0.25}>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-bloom p-4">
              <div className="flex items-center gap-2 mb-2">
                {(chronotype as { chronotype?: string })?.chronotype === "lion" ? <Sun size={14} className="text-bloom-yellow" /> : <Moon size={14} className="text-bloom-lavender" />}
                <p className="text-[10px] font-bold text-bloom-deep/40 uppercase">Chronotype</p>
              </div>
              <p className="text-sm font-bold text-bloom-deep capitalize">{(chronotype as { chronotype?: string })?.chronotype || "bear"}</p>
              <p className="text-[9px] text-bloom-deep/40 mt-1">Peak: {(chronotype as { peak_performance_hours?: string })?.peak_performance_hours || "10AM-2PM"}</p>
            </div>

            <div className="card-bloom p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-bloom-forest" />
                <p className="text-[10px] font-bold text-bloom-deep/40 uppercase">Social Jet Lag</p>
              </div>
              <p className="text-sm font-bold text-bloom-deep">{(socialJetlag as { social_jetlag_hours?: number })?.social_jetlag_hours || 0}h</p>
              <p className="text-[9px] text-bloom-deep/40 mt-1">{(socialJetlag as { severity?: string })?.severity || "unknown"}</p>
            </div>
          </div>
        </BlurFade>

        {/* Daily Plan */}
        {dailyPlan && (dailyPlan as { plan?: Record<string, unknown[]> }).plan && (
          <BlurFade delay={0.3}>
            <div className="card-bloom p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-bloom-forest" />
                <p className="text-xs font-bold text-bloom-deep/70 uppercase tracking-wider">Your Personalized Plan</p>
              </div>

              {["morning", "afternoon", "evening"].map((period) => {
                const items = ((dailyPlan as { plan: Record<string, Array<{ time: string; action: string; emoji: string; duration: string }>> }).plan[period]) || [];
                if (items.length === 0) return null;
                return (
                  <div key={period} className="mb-4 last:mb-0">
                    <p className="text-xs font-bold text-bloom-deep/50 capitalize mb-2 flex items-center gap-1">
                      {period === "morning" ? "🌅" : period === "afternoon" ? "☀️" : "🌙"} {period}
                    </p>
                    <div className="space-y-1.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bloom-cream/40">
                          <span className="text-sm">{item.emoji}</span>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-bloom-deep">{item.action}</p>
                          </div>
                          <span className="text-[9px] text-bloom-deep/30">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </BlurFade>
        )}

        {/* Score Breakdown */}
        {wellnessScore && (wellnessScore as { breakdown?: Record<string, { score: number; label: string; weight: string }> }).breakdown && (
          <BlurFade delay={0.35}>
            <div className="card-bloom p-5">
              <p className="text-xs font-bold text-bloom-deep/50 uppercase tracking-wider mb-3">Score Breakdown</p>
              <div className="space-y-2">
                {Object.entries((wellnessScore as { breakdown: Record<string, { score: number; label: string; weight: string }> }).breakdown).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-bloom-deep w-20 capitalize">{key}</span>
                    <div className="flex-1 h-2 rounded-full bg-bloom-sage/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-bloom-sage"
                        initial={{ width: 0 }}
                        animate={{ width: `${val.score}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-bloom-deep/50 w-8 text-right">{val.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function metricEmoji(key: string): string {
  const map: Record<string, string> = {
    sleep_hours: "😴", sleep_quality: "🌙", mood: "🌸", energy: "⚡",
    stress: "😤", hydration_glasses: "💧", exercise_minutes: "🏃",
    pain_level: "🩹", caffeine_mg: "☕", weight_kg: "⚖️", steps: "🚶", notes: "📝",
  };
  return map[key] || "🌱";
}

export default SmartCheckinPage;
