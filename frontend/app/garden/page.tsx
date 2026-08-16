"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Droplets, Footprints, Moon, Heart, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BloomieChat } from "@/components/shared/bloomie-chat";
import { TimeToggle, type TimeOfDay } from "@/components/shared/time-toggle";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";
import { getBloomieUser } from "@/lib/auth";
import type { GardenState, Quest } from "@/lib/types";

const GardenScene3D = dynamic(
  () => import("@/components/garden/garden-scene-3d").then((m) => m.GardenScene3D),
  { ssr: false, loading: () => <div className="scene-canvas bg-gradient-to-b from-bloom-sky to-bloom-cream" /> }
);

function GardenPage() {
  const router = useRouter();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const user = getBloomieUser();
  const userName = user?.name?.split(" ")[0] || "friend";

  const [gardenState, setGardenState] = useState<GardenState>({
    sky: "clear",
    pond_level: 0.7,
    tree_growth: 0.6,
    butterfly_count: 5,
    bird_count: 3,
    firefly_count: 0,
    flower_bloom: 0.7,
    rabbit_mood: "happy",
  });

  const [quests, setQuests] = useState<Quest[]>([]);
  const [showQuests, setShowQuests] = useState(false);
  const [animalMsg, setAnimalMsg] = useState<string | null>(null);
  const [bloomieNarrative, setBloomieNarrative] = useState("Your garden is growing beautifully! 🌸");
  const [gardenItems, setGardenItems] = useState<Array<{ emoji: string; item_name: string; source_metric: string; planted_at: string }>>([]);
  const [showItems, setShowItems] = useState(false);

  // Fetch garden state and quests
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayData, questsData, itemsData] = await Promise.all([
          api.getToday(),
          api.getQuests(),
          api.getGardenItems(),
        ]);
        if (todayData) {
          const gs = todayData.garden_state as GardenState;
          if (gs) setGardenState(gs);
          if (todayData.bloomie_thought) setBloomieNarrative(todayData.bloomie_thought as string);
        }
        if (questsData) setQuests(questsData as Quest[]);
        if (itemsData && (itemsData as { items: [] }).items) {
          setGardenItems((itemsData as { items: Array<{ emoji: string; item_name: string; source_metric: string; planted_at: string }> }).items);
        }
      } catch {
        // API unavailable, use defaults
      }
    };
    fetchData();
  }, []);

  // Random animal messages
  useEffect(() => {
    const messages = [
      "🐰 The rabbits think you're doing wonderfully!",
      "🦋 A butterfly just landed on your shoulder!",
      "🐦 The birds are singing your song today!",
      "🌸 The flowers are blooming just for you!",
      "🐰 Hop hop! Don't forget to drink water!",
      "🌳 The tree whispers: you're growing stronger!",
      "🦋 Even butterflies take rest days. You should too!",
      "🐦 A little bird told me you're amazing!",
      "✨ The fireflies think you're magical!",
      "🌷 Your garden says thank you for caring!",
    ];
    const show = () => {
      setAnimalMsg(messages[Math.floor(Math.random() * messages.length)]);
      setTimeout(() => setAnimalMsg(null), 4500);
    };
    const interval = setInterval(show, 20000 + Math.random() * 15000);
    show();
    return () => clearInterval(interval);
  }, []);

  const handleQuestComplete = useCallback(async (questId: string) => {
    try {
      await api.updateQuestProgress(questId, 1);
      setQuests((prev) => prev.map((q) => (q.id === questId ? { ...q, status: "completed" as const, current_value: 1 } : q)));
    } catch {
      // silently fail
    }
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 3D Garden Scene */}
      <GardenScene3D gardenState={gardenState} timeOfDay={timeOfDay} />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="p-2.5 rounded-full glass hover:bg-white/80 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} className="text-bloom-deep" />
        </button>

        <div className="flex items-center gap-2">
          <TimeToggle timeOfDay={timeOfDay} onChange={setTimeOfDay} />
        </div>
      </div>

      {/* Bloomie narrative bubble */}
      <div className="absolute top-16 left-4 right-4 z-10">
        <BlurFade delay={0.5}>
          <motion.div
            className="glass-strong px-5 py-3 rounded-2xl max-w-sm mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">🌸</span>
              <p className="text-sm font-medium text-bloom-deep leading-relaxed">
                {bloomieNarrative}
              </p>
            </div>
          </motion.div>
        </BlurFade>
      </div>

      {/* Animal message bubble */}
      <AnimatePresence>
        {animalMsg && (
          <motion.div
            className="absolute top-32 left-4 right-4 z-10 flex justify-center"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
          >
            <div className="glass px-4 py-2 rounded-full">
              <p className="text-xs font-medium text-bloom-deep">{animalMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Garden stats - bottom overlay */}
      <div className="absolute bottom-24 left-4 right-4 z-10">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Quick stats */}
          <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
            <Droplets size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-bloom-deep">
              {Math.round(gardenState.pond_level * 100)}%
            </span>
          </div>
          <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
            <Footprints size={14} className="text-bloom-sage" />
            <span className="text-xs font-semibold text-bloom-deep">
              {gardenState.butterfly_count} 🦋
            </span>
          </div>
          <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
            <Moon size={14} className="text-bloom-lavender" />
            <span className="text-xs font-semibold text-bloom-deep">
              {gardenState.sky}
            </span>
          </div>
          <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
            <Heart size={14} className="text-bloom-rose" />
            <span className="text-xs font-semibold text-bloom-deep">
              {gardenState.bird_count} 🐦
            </span>
          </div>

          {/* Quests button */}
          <button
            onClick={() => setShowQuests(!showQuests)}
            className="glass px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-white/80 transition-colors"
          >
            <Sparkles size={14} className="text-bloom-yellow" />
            <span className="text-xs font-semibold text-bloom-deep">
              Quests ({quests.filter((q) => q.status === "active").length})
            </span>
          </button>

          {/* Garden items button */}
          <button
            onClick={() => setShowItems(!showItems)}
            className="glass px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-white/80 transition-colors"
          >
            <span className="text-sm">🌸</span>
            <span className="text-xs font-semibold text-bloom-deep">
              Items ({gardenItems.length})
            </span>
          </button>
        </div>
      </div>

      {/* Quests panel */}
      <AnimatePresence>
        {showQuests && (
          <motion.div
            className="absolute bottom-36 left-4 right-4 z-20 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="glass-strong rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-bloom-deep mb-2">Today&apos;s Quests 🌱</h3>
              {quests.length === 0 && (
                <p className="text-xs text-bloom-deep/50">No active quests. Check back tomorrow!</p>
              )}
              {quests.slice(0, 4).map((quest) => (
                <div key={quest.id} className={`quest-card flex items-center justify-between ${quest.status === "completed" ? "completed" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-bloom-deep">{quest.title}</p>
                    <p className="text-[10px] text-bloom-deep/50">{quest.description}</p>
                  </div>
                  {quest.status === "active" ? (
                    <button
                      onClick={() => handleQuestComplete(quest.id)}
                      className="px-3 py-1 rounded-full bg-bloom-sage/20 text-bloom-forest text-xs font-semibold hover:bg-bloom-sage/30 transition-colors"
                    >
                      Done ✓
                    </button>
                  ) : (
                    <span className="text-xs text-bloom-sage font-semibold">✅</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Garden Items Panel */}
      <AnimatePresence>
        {showItems && (
          <motion.div
            className="absolute bottom-36 left-4 right-4 z-20 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="glass-strong rounded-2xl p-4 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-bold text-bloom-deep mb-2">Your Garden Items 🌸 ({gardenItems.length})</h3>
              {gardenItems.length === 0 && (
                <p className="text-xs text-bloom-deep/50">Log wellness data to plant items here!</p>
              )}
              <div className="grid grid-cols-4 gap-2">
                {gardenItems.slice(0, 20).map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-white/50 hover:bg-white/80 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    title={`${item.item_name} (from ${item.source_metric})`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[8px] text-bloom-deep/40 text-center leading-tight">{item.item_name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bloomie chat */}
      <BloomieChat />

      {/* Bottom nav */}
      <BottomNav />
    </main>
  );
}

export default GardenPage;
