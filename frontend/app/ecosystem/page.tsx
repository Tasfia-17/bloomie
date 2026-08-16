"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Trophy, Star, Sparkles, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BloomieChat } from "@/components/shared/bloomie-chat";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

type EcosystemItem = {
  category: string;
  name: string;
  emoji: string;
  quests_needed: number;
  unlocked: boolean;
};

type LevelInfo = {
  level: number;
  name: string;
  emoji: string;
  quests_needed: number;
  unlocks: string[];
};

function EcosystemPage() {
  const [currentLevel, setCurrentLevel] = useState<LevelInfo>({ level: 1, name: "Seedling", emoji: "🌱", quests_needed: 0, unlocks: [] });
  const [nextLevel, setNextLevel] = useState<LevelInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [questsRemaining, setQuestsRemaining] = useState(3);
  const [totalQuests, setTotalQuests] = useState(0);
  const [unlockedItems, setUnlockedItems] = useState<EcosystemItem[]>([]);
  const [lockedItems, setLockedItems] = useState<EcosystemItem[]>([]);
  const [allLevels, setAllLevels] = useState<LevelInfo[]>([]);
  const [achievements, setAchievements] = useState<Array<{ name: string; emoji: string; description: string; unlocked: boolean }>>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [richness, setRichness] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eco, ach] = await Promise.all([
          api.getEcosystem(),
          api.getAchievements(),
        ]);
        if (eco) {
          setCurrentLevel((eco as { level: LevelInfo }).level);
          setNextLevel((eco as { next_level: LevelInfo | null }).next_level);
          setProgress((eco as { progress_to_next: number }).progress_to_next || 0);
          setQuestsRemaining((eco as { quests_remaining: number }).quests_remaining || 0);
          setTotalQuests((eco as { total_quests_completed: number }).total_quests_completed || 0);
          setUnlockedItems((eco as { unlocked_items: EcosystemItem[] }).unlocked_items || []);
          setLockedItems((eco as { locked_items: EcosystemItem[] }).locked_items || []);
          setAllLevels((eco as { all_levels: LevelInfo[] }).all_levels || []);
          setRichness((eco as { garden_richness: number }).garden_richness || 0);
        }
        if (ach) {
          setAchievements((ach as { achievements: typeof achievements }).achievements || []);
        }
      } catch {
        // Use defaults
      }
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      {/* Header with garden richness */}
      <div className="bg-gradient-to-b from-bloom-mint/30 via-bloom-sage/10 to-bloom-cream px-6 pt-12 pb-8">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Your Ecosystem 🌍</h1>
          <p className="text-sm text-bloom-deep/60 mt-1">
            Grow your world through wellness consistency
          </p>
        </BlurFade>
      </div>

      <div className="px-5 space-y-6 max-w-lg mx-auto">
        {/* Current Level Card */}
        <BlurFade delay={0.2}>
          <div className="card-bloom p-6 bg-gradient-to-br from-white to-bloom-mint/10 relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-bloom-sage/10 blob" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.span
                    className="text-4xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {currentLevel.emoji}
                  </motion.span>
                  <div>
                    <p className="text-xs text-bloom-deep/50 uppercase tracking-wider font-bold">Level {currentLevel.level}</p>
                    <h2 className="text-xl font-bold text-bloom-deep">{currentLevel.name}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-bloom-forest">{totalQuests}</p>
                  <p className="text-[10px] text-bloom-deep/40 uppercase">Quests Done</p>
                </div>
              </div>

              {/* Progress to next level */}
              {nextLevel && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-bloom-deep/60">Next: {nextLevel.emoji} {nextLevel.name}</span>
                    <span className="font-bold text-bloom-forest">{questsRemaining} quests to go</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill bg-gradient-to-r from-bloom-sage to-bloom-forest"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Garden Richness */}
        <BlurFade delay={0.3}>
          <div className="card-bloom p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">Garden Richness</h3>
              <span className="text-lg font-bold text-bloom-forest">{Math.round(richness * 100)}%</span>
            </div>
            <div className="relative w-full h-4 rounded-full bg-bloom-sage/10 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-bloom"
                initial={{ width: 0 }}
                animate={{ width: `${richness * 100}%` }}
                transition={{ duration: 2 }}
              />
            </div>
            <p className="text-xs text-bloom-deep/40 mt-2">
              Unlock more items to make your garden richer and more alive!
            </p>
          </div>
        </BlurFade>

        {/* Unlocked Items */}
        <BlurFade delay={0.4}>
          <div className="card-bloom p-5">
            <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-4">
              Unlocked 🎉 ({unlockedItems.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unlockedItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bloom-mint/15 border border-bloom-mint/25"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-xs font-semibold text-bloom-deep">{item.name}</span>
                </motion.div>
              ))}
              {unlockedItems.length === 0 && (
                <p className="text-xs text-bloom-deep/40">Complete quests to unlock garden items!</p>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Locked Items (teaser) */}
        <BlurFade delay={0.5}>
          <div className="card-bloom p-5">
            <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-4">
              Coming Soon 🔒 ({lockedItems.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {lockedItems.slice(0, 8).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bloom-cream/60 border border-bloom-deep/5 opacity-60"
                >
                  <Lock size={12} className="text-bloom-deep/30" />
                  <span className="text-xs text-bloom-deep/40">{item.quests_needed} quests</span>
                </div>
              ))}
              {lockedItems.length > 8 && (
                <div className="flex items-center gap-1 px-3 py-2 text-xs text-bloom-deep/40">
                  +{lockedItems.length - 8} more
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Level Roadmap */}
        <BlurFade delay={0.6}>
          <div className="card-bloom p-5">
            <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider mb-4">Level Roadmap</h3>
            <div className="space-y-3">
              {allLevels.map((lvl) => {
                const isUnlocked = totalQuests >= lvl.quests_needed;
                const isCurrent = lvl.level === currentLevel.level;
                return (
                  <div
                    key={lvl.level}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-bloom-sage/15 border border-bloom-sage/30"
                        : isUnlocked
                        ? "bg-bloom-mint/5"
                        : "opacity-50"
                    }`}
                  >
                    <span className="text-2xl">{lvl.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-bloom-deep">
                        Lvl {lvl.level}: {lvl.name}
                        {isCurrent && <span className="ml-2 text-bloom-sage text-xs">← You</span>}
                      </p>
                      <p className="text-[10px] text-bloom-deep/40">
                        {lvl.quests_needed} quests · Unlocks: {lvl.unlocks.join(", ")}
                      </p>
                    </div>
                    {isUnlocked ? (
                      <Star size={16} className="text-bloom-sage fill-bloom-sage" />
                    ) : (
                      <Lock size={14} className="text-bloom-deep/20" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </BlurFade>

        {/* Achievements */}
        <BlurFade delay={0.7}>
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="card-bloom p-5 w-full text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-bloom-yellow" />
                <h3 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">
                  Achievements ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
                </h3>
              </div>
              <ChevronRight size={16} className={`text-bloom-deep/30 transition-transform ${showAchievements ? "rotate-90" : ""}`} />
            </div>
          </button>
        </BlurFade>

        <AnimatePresence>
          {showAchievements && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {achievements.map((ach) => (
                <div
                  key={ach.name}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    ach.unlocked ? "bg-bloom-yellow/10 border border-bloom-yellow/20" : "bg-bloom-cream/50 opacity-60"
                  }`}
                >
                  <span className="text-xl">{ach.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-bloom-deep">{ach.name}</p>
                    <p className="text-[10px] text-bloom-deep/40">{ach.description}</p>
                  </div>
                  {ach.unlocked && <Sparkles size={14} className="text-bloom-yellow" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BloomieChat />
      <BottomNav />
    </main>
  );
}

export default EcosystemPage;
