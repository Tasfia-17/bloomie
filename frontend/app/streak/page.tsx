"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame, Trophy, Calendar, Sparkles } from "lucide-react";
import { BlurFade } from "@/components/shared/blur-fade";
import { BottomNav } from "@/components/shared/bottom-nav";
import { api } from "@/lib/api";

const STREAK_MILESTONES = [
  { days: 3, emoji: "🔥", title: "Getting Started", reward: "Small flame" },
  { days: 7, emoji: "🔥🔥", title: "One Week!", reward: "Garden path stone" },
  { days: 14, emoji: "🔥🔥🔥", title: "Two Weeks!", reward: "New flower species" },
  { days: 21, emoji: "💎", title: "Three Weeks!", reward: "Crystal butterfly" },
  { days: 30, emoji: "👑", title: "One Month!", reward: "Golden tree branch" },
  { days: 60, emoji: "🌟", title: "Two Months!", reward: "Northern lights" },
  { days: 100, emoji: "🏆", title: "Century!", reward: "Legendary garden" },
];

function StreakPage() {
  const router = useRouter();
  const [streak, setStreak] = useState(7);
  const [weekHistory, setWeekHistory] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<typeof STREAK_MILESTONES[0] | null>(null);
  const [nextMilestone, setNextMilestone] = useState<typeof STREAK_MILESTONES[0] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = await api.getToday();
        if (today) {
          const s = (today as { streak_days?: number }).streak_days || 0;
          setStreak(s);
        }
      } catch {
        // Use default streak of 7
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Find current and next milestone
    let current: typeof STREAK_MILESTONES[0] | null = null;
    let next: typeof STREAK_MILESTONES[0] | null = null;

    for (let i = 0; i < STREAK_MILESTONES.length; i++) {
      if (streak >= STREAK_MILESTONES[i].days) {
        current = STREAK_MILESTONES[i];
      } else {
        next = STREAK_MILESTONES[i];
        break;
      }
    }
    setCurrentMilestone(current);
    setNextMilestone(next);

    // Show celebration if just hit a milestone
    if (current && streak === current.days) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [streak]);

  const flameScale = Math.min(1 + streak * 0.05, 2.5);
  const daysToNext = nextMilestone ? nextMilestone.days - streak : 0;
  const progressToNext = nextMilestone && currentMilestone
    ? (streak - currentMilestone.days) / (nextMilestone.days - currentMilestone.days)
    : 1;

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-peach/20 via-bloom-cream to-bloom-yellow/10 pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/today")}
            className="p-2.5 rounded-full glass hover:bg-white/80 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} className="text-bloom-deep" />
          </button>
          <h1 className="font-display text-lg font-bold text-bloom-deep">Your Streak</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 space-y-6 max-w-lg mx-auto">
        {/* Main Streak Display */}
        <BlurFade delay={0.1}>
          <div className="card-bloom p-8 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-100/30 to-transparent rounded-[1.5rem]" />

            <div className="relative z-10">
              {/* Fire animation */}
              <motion.div
                className="relative mx-auto mb-4 flex items-center justify-center"
                style={{ width: 120, height: 120 }}
              >
                {/* Outer glow */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-orange-400/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Fire emoji with scaling */}
                <motion.div
                  animate={{
                    scale: [flameScale * 0.95, flameScale, flameScale * 0.95],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Flame size={64} className="text-orange-500" fill="currentColor" />
                </motion.div>

                {/* Sparkle particles */}
                {streak >= 7 && [...Array(5)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-sm"
                    style={{
                      left: `${30 + i * 12}%`,
                      top: `${20 + (i % 3) * 20}%`,
                    }}
                    animate={{
                      y: [0, -15, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                  >
                    ✨
                  </motion.span>
                ))}
              </motion.div>

              {/* Streak number */}
              <motion.p
                className="text-5xl font-bold text-bloom-deep"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {streak}
              </motion.p>
              <p className="text-sm text-bloom-deep/50 font-semibold uppercase tracking-wider mt-1">
                Day Streak
              </p>

              {/* Current milestone badge */}
              {currentMilestone && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bloom-yellow/20 border border-bloom-yellow/30">
                  <span className="text-base">{currentMilestone.emoji}</span>
                  <span className="text-xs font-bold text-bloom-deep">{currentMilestone.title}</span>
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <BlurFade delay={0.2}>
            <div className="card-bloom p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">
                  Next Milestone
                </h3>
                <span className="text-sm font-bold text-bloom-forest">
                  {daysToNext} days away
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{nextMilestone.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-bloom-deep">{nextMilestone.title}</p>
                  <p className="text-xs text-bloom-deep/40">Reward: {nextMilestone.reward}</p>
                </div>
              </div>

              <div className="progress-bar">
                <motion.div
                  className="progress-bar-fill bg-gradient-to-r from-orange-300 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext * 100}%` }}
                  transition={{ duration: 1.5 }}
                />
              </div>
            </div>
          </BlurFade>
        )}

        {/* Week View */}
        <BlurFade delay={0.3}>
          <div className="card-bloom p-5">
            <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-4">
              This Week
            </h3>
            <div className="flex items-center justify-between">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-bloom-deep/40">{day}</span>
                  <motion.div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      weekHistory[i]
                        ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white"
                        : "bg-bloom-cream border border-bloom-deep/10"
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    {weekHistory[i] ? (
                      <Flame size={14} fill="currentColor" />
                    ) : (
                      <Calendar size={12} className="text-bloom-deep/20" />
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* All Milestones */}
        <BlurFade delay={0.4}>
          <div className="card-bloom p-5">
            <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-4">
              Milestones
            </h3>
            <div className="space-y-3">
              {STREAK_MILESTONES.map((m) => {
                const achieved = streak >= m.days;
                return (
                  <div
                    key={m.days}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      achieved ? "bg-bloom-yellow/10 border border-bloom-yellow/20" : "opacity-50"
                    }`}
                  >
                    <span className="text-xl w-10 text-center">{m.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-bloom-deep">{m.days} days — {m.title}</p>
                      <p className="text-[10px] text-bloom-deep/40">🎁 {m.reward}</p>
                    </div>
                    {achieved && <Trophy size={14} className="text-bloom-yellow" />}
                  </div>
                );
              })}
            </div>
          </div>
        </BlurFade>

        {/* Bloomie's streak thought */}
        <BlurFade delay={0.5}>
          <div className="card-bloom p-5 bg-gradient-to-br from-white to-bloom-peach/10">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌸</span>
              <div>
                <p className="text-sm font-medium text-bloom-deep leading-relaxed">
                  {streak >= 14
                    ? "Two weeks of consistent care! Your garden has never been more alive. I'm so proud of you! 🌳✨"
                    : streak >= 7
                    ? "A full week! Every day you show up, your tree grows a little taller. Keep going! 🌱🔥"
                    : streak >= 3
                    ? "Three days in a row! The garden is starting to notice your presence. 🌷"
                    : "Every journey starts with a single step. Your garden is ready for you! 🌱"
                  }
                </p>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 mx-6 text-center shadow-bloom-xl"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <span className="text-6xl block mb-4">{currentMilestone?.emoji || "🔥"}</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-bloom-deep mb-2">
                {currentMilestone?.title || "Milestone!"}
              </h2>
              <p className="text-sm text-bloom-deep/60 mb-4">
                {streak} days of wellness! Your garden is celebrating!
              </p>

              {/* Confetti particles */}
              <div className="relative h-12 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-lg"
                    style={{ left: `${5 + i * 8}%` }}
                    animate={{ y: [-20, 60], opacity: [1, 0], rotate: [0, 360] }}
                    transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                  >
                    {["🌸", "✨", "🦋", "🌷", "💫", "🔥", "🌱", "🐰", "⭐", "🌺", "💎", "🌈"][i]}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}

export default StreakPage;
