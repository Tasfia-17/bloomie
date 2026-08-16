"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, BookOpen, Send } from "lucide-react";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";
import { getBloomieUser } from "@/lib/auth";

const MOODS = [
  { emoji: "😊", label: "Great", value: 9, color: "from-bloom-mint to-bloom-sage" },
  { emoji: "🙂", label: "Good", value: 7, color: "from-bloom-sage to-bloom-forest" },
  { emoji: "😐", label: "Okay", value: 5, color: "from-bloom-yellow to-bloom-autumn" },
  { emoji: "😔", label: "Low", value: 3, color: "from-bloom-peach to-bloom-rose" },
  { emoji: "😢", label: "Rough", value: 1, color: "from-bloom-rose to-bloom-coral" },
];

const ENERGY_LABELS = ["Exhausted", "Low", "Moderate", "Good", "Energized"];

function CheckinPage() {
  const router = useRouter();
  const user = getBloomieUser();
  const [step, setStep] = useState(0); // 0: mood, 1: energy, 2: stress, 3: journal, 4: done
  const [mood, setMood] = useState<number | null>(null);
  const [moodEmoji, setMoodEmoji] = useState("🙂");
  const [energy, setEnergy] = useState(3); // 1-5
  const [stress, setStress] = useState(3); // 1-5
  const [journal, setJournal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gardenFeedback, setGardenFeedback] = useState<string | null>(null);

  const handleMoodSelect = (m: typeof MOODS[0]) => {
    setMood(m.value);
    setMoodEmoji(m.emoji);
    setTimeout(() => setStep(1), 400);
  };

  const handleSubmit = useCallback(async () => {
    if (mood === null) return;
    setIsSubmitting(true);

    try {
      // Submit mood
      await api.postWellnessData({
        category: "self_report",
        metric: "mood",
        value: { score: mood, emoji: moodEmoji },
        source: "checkin",
      });

      // Submit energy
      await api.postWellnessData({
        category: "self_report",
        metric: "energy",
        value: { score: energy * 2, level: ENERGY_LABELS[energy - 1] },
        source: "checkin",
      });

      // Submit stress
      await api.postWellnessData({
        category: "self_report",
        metric: "stress",
        value: { score: stress * 2, level: stress <= 2 ? "low" : stress <= 4 ? "moderate" : "high" },
        source: "checkin",
      });

      // Submit journal if filled
      if (journal.trim()) {
        await api.postWellnessData({
          category: "self_report",
          metric: "journal",
          value: { text: journal.trim(), mood_at_time: mood },
          source: "checkin",
        });
      }

      // Get garden feedback
      const feedbackMessages: Record<number, string> = {
        9: "🌸 Your garden is absolutely glowing today! New flowers are blooming!",
        7: "🌱 Your garden is growing beautifully. The rabbits are playing!",
        5: "🌿 Your garden is calm today. Every day is a new opportunity.",
        3: "🌧️ A gentle rain is falling in your garden. Even rain helps things grow.",
        1: "💜 Your garden is wrapping you in a warm blanket. It's okay to rest.",
      };
      setGardenFeedback(feedbackMessages[mood] || "🌸 Thank you for checking in!");
      setStep(4);
    } catch {
      setGardenFeedback("🌸 Check-in saved! Your garden is updating...");
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  }, [mood, moodEmoji, energy, stress, journal]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-lavender/20 via-bloom-cream to-bloom-mint/20 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-bloom-lavender/20"
            style={{ left: `${15 + i * 18}%`, top: `${30 + (i % 3) * 20}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 && step < 4 ? setStep(step - 1) : router.push("/today")}
            className="p-2.5 rounded-full glass hover:bg-white/80 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} className="text-bloom-deep" />
          </button>
          {step < 4 && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all ${
                    s <= step ? "bg-bloom-lavender scale-110" : "bg-bloom-deep/15"
                  }`}
                />
              ))}
            </div>
          )}
          <div className="w-10" />
        </div>
      </div>

      <div className="relative z-10 px-6 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: Mood */}
          {step === 0 && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <BlurFade delay={0.1}>
                <div className="text-center">
                  <h1 className="font-display text-3xl font-bold text-bloom-deep mb-2">
                    How are you feeling?
                  </h1>
                  <p className="text-bloom-deep/50 text-sm">
                    Tap the emoji that matches your mood right now
                  </p>
                </div>
              </BlurFade>

              <div className="flex flex-col items-center gap-4">
                {MOODS.map((m, i) => (
                  <motion.button
                    key={m.value}
                    onClick={() => handleMoodSelect(m)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl card-bloom transition-all ${
                      mood === m.value ? "ring-2 ring-bloom-sage shadow-bloom-lg" : ""
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.span
                      className="text-4xl"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      {m.emoji}
                    </motion.span>
                    <div className="flex-1 text-left">
                      <p className="text-lg font-bold text-bloom-deep">{m.label}</p>
                    </div>
                    <div className={`w-8 h-2 rounded-full bg-gradient-to-r ${m.color}`} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Energy */}
          {step === 1 && (
            <motion.div
              key="energy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.span className="text-5xl block mb-3" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  ⚡
                </motion.span>
                <h1 className="font-display text-3xl font-bold text-bloom-deep mb-2">
                  Energy level?
                </h1>
                <p className="text-bloom-deep/50 text-sm">
                  How much energy do you have right now?
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  {ENERGY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setEnergy(i + 1)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        energy === i + 1 ? "bg-bloom-sage/20 scale-110" : "opacity-60"
                      }`}
                    >
                      <span className="text-2xl">{"🔋".repeat(1)}</span>
                      <span className="text-[10px] font-semibold text-bloom-deep">{label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={1}
                  max={5}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none bg-bloom-sage/20 accent-bloom-forest"
                />

                <motion.button
                  onClick={() => setStep(2)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-bloom-sage to-bloom-forest text-white font-bold text-lg shadow-bloom"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Stress */}
          {step === 2 && (
            <motion.div
              key="stress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.span className="text-5xl block mb-3" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  🧘
                </motion.span>
                <h1 className="font-display text-3xl font-bold text-bloom-deep mb-2">
                  Stress level?
                </h1>
                <p className="text-bloom-deep/50 text-sm">1 = totally calm, 5 = very stressed</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.button
                    key={s}
                    onClick={() => setStress(s)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                      stress === s
                        ? s <= 2
                          ? "bg-bloom-mint/30 text-bloom-forest ring-2 ring-bloom-sage"
                          : s <= 3
                          ? "bg-bloom-yellow/30 text-bloom-deep ring-2 ring-bloom-yellow"
                          : "bg-bloom-rose/30 text-bloom-deep ring-2 ring-bloom-rose"
                        : "bg-bloom-cream text-bloom-deep/40"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={() => setStep(3)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-bloom-sage to-bloom-forest text-white font-bold text-lg shadow-bloom"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue →
              </motion.button>
            </motion.div>
          )}

          {/* Step 3: Journal */}
          {step === 3 && (
            <motion.div
              key="journal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <BookOpen size={32} className="mx-auto text-bloom-lavender mb-3" />
                <h1 className="font-display text-3xl font-bold text-bloom-deep mb-2">
                  Anything on your mind?
                </h1>
                <p className="text-bloom-deep/50 text-sm">
                  Optional — write freely. This stays private. 🔒
                </p>
              </div>

              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="Today I felt... / I noticed... / I'm grateful for..."
                className="w-full h-40 px-5 py-4 rounded-2xl bg-white border border-bloom-sage/20 text-bloom-deep placeholder-bloom-deep/30 resize-none focus:outline-none focus:ring-2 focus:ring-bloom-lavender/40 transition-all text-sm leading-relaxed"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-4 rounded-2xl bg-bloom-cream border border-bloom-sage/20 text-bloom-deep font-semibold"
                >
                  Skip
                </button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-bloom-lavender to-bloom-dusk text-white font-bold shadow-bloom flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>🌸</motion.span>
                  ) : (
                    <>
                      <Send size={16} />
                      Save
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Done - Garden Feedback */}
          {step === 4 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center py-8"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-7xl block">{moodEmoji}</span>
              </motion.div>

              <div>
                <h1 className="font-display text-3xl font-bold text-bloom-deep mb-3">
                  Check-in complete! ✨
                </h1>
                <p className="text-bloom-deep/60 text-sm leading-relaxed max-w-xs mx-auto">
                  {gardenFeedback}
                </p>
              </div>

              {/* Animated reward particles */}
              <div className="relative h-20">
                {[...Array(8)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-lg"
                    style={{ left: `${20 + i * 8}%` }}
                    animate={{
                      y: [0, -40, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.2, 0.5],
                    }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                  >
                    {["🌸", "🦋", "✨", "🌿", "🌷", "💫", "🐰", "🌱"][i]}
                  </motion.span>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => router.push("/garden")}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-bloom-sage to-bloom-forest text-white font-bold shadow-bloom"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Visit Garden 🌳
                </motion.button>
                <motion.button
                  onClick={() => router.push("/today")}
                  className="flex-1 py-4 rounded-2xl bg-white border border-bloom-sage/20 text-bloom-deep font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to Today
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default CheckinPage;
