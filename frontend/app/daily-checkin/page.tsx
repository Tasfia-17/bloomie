"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

// Weather-mood visual picker
const WEATHER_MOODS = [
  { emoji: "☀️", label: "Sunny", mood: 9, color: "bg-yellow-100 border-yellow-300" },
  { emoji: "🌤️", label: "Mostly clear", mood: 7, color: "bg-blue-50 border-blue-200" },
  { emoji: "⛅", label: "Partly cloudy", mood: 5, color: "bg-gray-100 border-gray-200" },
  { emoji: "🌧️", label: "Rainy", mood: 3, color: "bg-indigo-50 border-indigo-200" },
  { emoji: "⛈️", label: "Stormy", mood: 1, color: "bg-gray-200 border-gray-400" },
];

// Body feelings visual picker
const BODY_AREAS = [
  { id: "head", emoji: "🧠", label: "Head", y: 0 },
  { id: "chest", emoji: "💓", label: "Chest", y: 1 },
  { id: "stomach", emoji: "🦋", label: "Stomach", y: 2 },
  { id: "hands", emoji: "🤲", label: "Hands", y: 3 },
  { id: "legs", emoji: "🦵", label: "Legs", y: 4 },
  { id: "whole", emoji: "🧘", label: "Whole body", y: 5 },
];

// Detailed emoji grid for feelings
const FEELINGS_GRID = [
  { emoji: "😊", label: "Happy" }, { emoji: "😌", label: "Calm" }, { emoji: "🥰", label: "Loved" },
  { emoji: "💪", label: "Strong" }, { emoji: "🤩", label: "Excited" }, { emoji: "🙏", label: "Grateful" },
  { emoji: "😐", label: "Neutral" }, { emoji: "🤔", label: "Thoughtful" }, { emoji: "😴", label: "Tired" },
  { emoji: "😤", label: "Frustrated" }, { emoji: "😰", label: "Anxious" }, { emoji: "😔", label: "Sad" },
  { emoji: "🤯", label: "Overwhelmed" }, { emoji: "😡", label: "Angry" }, { emoji: "🥺", label: "Lonely" },
  { emoji: "🫠", label: "Drained" }, { emoji: "🤒", label: "Unwell" }, { emoji: "😇", label: "At peace" },
];

// Sleep quality visual
const SLEEP_QUALITY = [
  { emoji: "😫", label: "Terrible", value: 1, color: "bg-red-100" },
  { emoji: "😕", label: "Poor", value: 3, color: "bg-orange-100" },
  { emoji: "😐", label: "Okay", value: 5, color: "bg-yellow-100" },
  { emoji: "😊", label: "Good", value: 7, color: "bg-green-100" },
  { emoji: "😴", label: "Amazing", value: 9, color: "bg-bloom-mint/30" },
];

function DailyCheckinPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [weatherMood, setWeatherMood] = useState<typeof WEATHER_MOODS[0] | null>(null);
  const [bodyAreas, setBodyAreas] = useState<string[]>([]);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleBodyArea = (id: string) => {
    setBodyAreas((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const toggleFeeling = (label: string) => {
    setFeelings((prev) => prev.includes(label) ? prev.filter((f) => f !== label) : prev.length < 5 ? [...prev, label] : prev);
  };

  const handleSubmit = useCallback(async () => {
    try {
      await api.postWellnessData({
        category: "self_report",
        metric: "daily_checkin",
        value: {
          weather_mood: weatherMood?.label,
          weather_mood_score: weatherMood?.mood,
          body_areas: bodyAreas,
          feelings,
          sleep_quality: sleepQuality,
          note: note.trim() || null,
        },
        source: "daily_checkin",
      });

      // Plant for check-in
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      if (API_URL) {
        const userId = document.cookie.match(/bloomie_user=([^;]+)/)?.[1]
          ? JSON.parse(decodeURIComponent(document.cookie.match(/bloomie_user=([^;]+)/)![1])).id : "demo";
        fetch(`${API_URL}/api/garden/plant?metric=mood&value=checkin&user_id=${userId}`, { method: "POST" });
      }
    } catch { /* still show saved */ }
    setSaved(true);
  }, [weatherMood, bodyAreas, feelings, sleepQuality, note]);

  const canProceed = () => {
    if (step === 0) return weatherMood !== null;
    if (step === 1) return feelings.length > 0;
    if (step === 2) return true;
    if (step === 3) return sleepQuality !== null;
    return true;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-sky/15 via-bloom-cream to-bloom-mint/10 pb-24">
      <div className="px-6 pt-12 pb-4">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Daily Check-in 🌤️</h1>
          <p className="text-sm text-bloom-deep/50 mt-1">A quick visual snapshot of how you&apos;re doing</p>
          {!saved && (
            <div className="flex gap-1 mt-3">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-bloom-sage" : "bg-bloom-deep/10"}`} />
              ))}
            </div>
          )}
        </BlurFade>
      </div>

      <div className="px-5 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: Weather Mood */}
          {step === 0 && !saved && (
            <motion.div key="weather" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-center text-sm font-semibold text-bloom-deep mb-4">If your mood was weather, what would it be?</p>
              <div className="space-y-3">
                {WEATHER_MOODS.map((w) => (
                  <motion.button
                    key={w.label}
                    onClick={() => setWeatherMood(w)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      weatherMood?.label === w.label ? `${w.color} border-bloom-sage scale-[1.02]` : "bg-white border-transparent hover:border-bloom-sage/20"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-4xl">{w.emoji}</span>
                    <span className="text-base font-bold text-bloom-deep">{w.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Feelings Grid */}
          {step === 1 && !saved && (
            <motion.div key="feelings" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-center text-sm font-semibold text-bloom-deep mb-2">Pick up to 5 feelings</p>
              <p className="text-center text-xs text-bloom-deep/40 mb-4">({feelings.length}/5 selected)</p>
              <div className="grid grid-cols-3 gap-2">
                {FEELINGS_GRID.map((f) => (
                  <motion.button
                    key={f.label}
                    onClick={() => toggleFeeling(f.label)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      feelings.includes(f.label) ? "bg-bloom-lavender/20 border-2 border-bloom-lavender ring-1 ring-bloom-lavender/30" : "bg-white border-2 border-transparent hover:border-bloom-sage/15"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-[10px] font-semibold text-bloom-deep/70">{f.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Body Scan */}
          {step === 2 && !saved && (
            <motion.div key="body" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-center text-sm font-semibold text-bloom-deep mb-4">Where do you feel tension or discomfort?</p>
              <p className="text-center text-xs text-bloom-deep/40 mb-4">(Tap areas, or skip if all is well)</p>
              <div className="grid grid-cols-2 gap-3">
                {BODY_AREAS.map((area) => (
                  <motion.button
                    key={area.id}
                    onClick={() => toggleBodyArea(area.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                      bodyAreas.includes(area.id) ? "bg-bloom-rose/15 border-2 border-bloom-rose/40" : "bg-white border-2 border-transparent hover:border-bloom-sage/15"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-2xl">{area.emoji}</span>
                    <span className="text-sm font-semibold text-bloom-deep">{area.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Sleep Quality */}
          {step === 3 && !saved && (
            <motion.div key="sleep" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-center text-sm font-semibold text-bloom-deep mb-4">How did you sleep last night?</p>
              <div className="flex items-center justify-center gap-3">
                {SLEEP_QUALITY.map((sq) => (
                  <motion.button
                    key={sq.value}
                    onClick={() => setSleepQuality(sq.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                      sleepQuality === sq.value ? `${sq.color} ring-2 ring-bloom-sage scale-110` : "bg-white hover:bg-bloom-cream"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-3xl">{sq.emoji}</span>
                    <span className="text-[10px] font-bold text-bloom-deep/60">{sq.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Note */}
          {step === 4 && !saved && (
            <motion.div key="note" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-center text-sm font-semibold text-bloom-deep mb-4">Anything else? (optional)</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A thought, a plan, a feeling, a hope..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-bloom-sage/15 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bloom-sage/30 leading-relaxed"
              />
            </motion.div>
          )}

          {/* Saved state */}
          {saved && (
            <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <span className="text-6xl block">🌸</span>
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-bloom-deep">Check-in complete!</h2>
              <p className="text-sm text-bloom-deep/50">A Mood Petal grew in your garden</p>
              <div className="flex gap-3 justify-center mt-6">
                <motion.button onClick={() => router.push("/garden")} className="px-6 py-3 rounded-xl bg-bloom-forest text-white font-bold" whileTap={{ scale: 0.95 }}>Visit Garden 🌳</motion.button>
                <motion.button onClick={() => router.push("/today")} className="px-6 py-3 rounded-xl bg-white border border-bloom-sage/20 text-bloom-deep font-semibold" whileTap={{ scale: 0.95 }}>Back</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {!saved && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 rounded-xl bg-white border border-bloom-sage/20 text-bloom-deep font-semibold">Back</button>
            )}
            {step < 4 ? (
              <motion.button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 py-3.5 rounded-xl bg-bloom-forest text-white font-bold disabled:opacity-30"
                whileTap={{ scale: 0.98 }}
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-bloom-sage to-bloom-forest text-white font-bold"
                whileTap={{ scale: 0.98 }}
              >
                Complete Check-in 🌸
              </motion.button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default DailyCheckinPage;
