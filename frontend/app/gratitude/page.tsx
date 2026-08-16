"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, BookOpen, Send, ChevronDown } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

const PROMPTS = [
  "What made you smile today?",
  "Who are you grateful for right now?",
  "What small thing went well today?",
  "What's something beautiful you noticed?",
  "What part of your body are you grateful for?",
  "What's a challenge that made you stronger?",
  "What's a comfort you're thankful for?",
  "Who made your day a little brighter?",
];

const MOOD_EMOJIS = ["🌸", "☀️", "🌈", "💫", "🦋", "🌊", "🔥", "🌙", "🍃", "❤️", "✨", "🐰"];

const AFFIRMATIONS = [
  "You are enough, exactly as you are. 🌸",
  "Your presence makes the world gentler. 🦋",
  "Growth happens at your own pace. 🌱",
  "You deserve the kindness you give others. 💜",
  "Today is full of tiny miracles. ✨",
  "Your feelings are valid and important. 🌊",
  "You are doing better than you think. 🌟",
  "Rest is productive. You've earned it. 🌙",
];

function GratitudePage() {
  const [entries, setEntries] = useState<string[]>(["", "", ""]);
  const [selectedEmoji, setSelectedEmoji] = useState("🌸");
  const [freeWrite, setFreeWrite] = useState("");
  const [saved, setSaved] = useState(false);
  const [todayPrompt, setTodayPrompt] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Array<{ date: string; entries: string[]; emoji: string }>>([]);

  useEffect(() => {
    // Random daily prompt and affirmation
    const day = new Date().getDate();
    setTodayPrompt(PROMPTS[day % PROMPTS.length]);
    setAffirmation(AFFIRMATIONS[day % AFFIRMATIONS.length]);

    // Load history from API
    const loadHistory = async () => {
      try {
        const data = await api.getWellnessData(undefined, "self_report", "gratitude");
        if (data && Array.isArray(data)) {
          setHistory(
            data.slice(0, 7).map((d: Record<string, unknown>) => ({
              date: (d.recorded_at as string || "").slice(0, 10),
              entries: ((d.value as Record<string, unknown>)?.entries as string[]) || [],
              emoji: ((d.value as Record<string, unknown>)?.emoji as string) || "🌸",
            }))
          );
        }
      } catch { /* use empty */ }
    };
    loadHistory();
  }, []);

  const handleSave = async () => {
    const filledEntries = entries.filter((e) => e.trim());
    if (filledEntries.length === 0 && !freeWrite.trim()) return;

    try {
      await api.postWellnessData({
        category: "self_report",
        metric: "gratitude",
        value: {
          entries: filledEntries,
          emoji: selectedEmoji,
          free_write: freeWrite.trim() || null,
          prompt: todayPrompt,
        },
        source: "gratitude_journal",
      });

      // Also plant a garden item
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      if (API_URL) {
        const userId = document.cookie.match(/bloomie_user=([^;]+)/)?.[1]
          ? JSON.parse(decodeURIComponent(document.cookie.match(/bloomie_user=([^;]+)/)![1])).id
          : "demo";
        fetch(`${API_URL}/api/garden/plant?metric=journal&value=gratitude&user_id=${userId}`, { method: "POST" });
      }
    } catch { /* still show saved */ }

    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  const updateEntry = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = value;
    setEntries(newEntries);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-peach/15 via-bloom-cream to-bloom-lavender/10 pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <BlurFade delay={0.1}>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={24} className="text-bloom-lavender" />
            <h1 className="font-display text-2xl font-bold text-bloom-deep">Gratitude Journal</h1>
          </div>
          <p className="text-sm text-bloom-deep/50">Grow your garden through thankfulness 🌹</p>
        </BlurFade>
      </div>

      <div className="px-5 max-w-lg mx-auto space-y-5">
        {/* Daily Affirmation */}
        <BlurFade delay={0.15}>
          <motion.div
            className="card-bloom p-5 bg-gradient-to-br from-white to-bloom-lavender/10 text-center"
            animate={{ scale: [1, 1.005, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles size={16} className="text-bloom-lavender mx-auto mb-2" />
            <p className="text-sm font-medium text-bloom-deep italic leading-relaxed">{affirmation}</p>
          </motion.div>
        </BlurFade>

        {/* Mood Emoji Picker */}
        <BlurFade delay={0.2}>
          <div className="card-bloom p-5">
            <p className="text-xs font-bold text-bloom-deep/50 uppercase tracking-wider mb-3">How does gratitude feel today?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {MOOD_EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                    selectedEmoji === emoji ? "bg-bloom-lavender/20 ring-2 ring-bloom-lavender scale-115" : "hover:bg-bloom-cream"
                  }`}
                  whileTap={{ scale: 0.8 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* Today's Prompt */}
        <BlurFade delay={0.25}>
          <div className="card-bloom p-5">
            <p className="text-xs font-bold text-bloom-deep/50 uppercase tracking-wider mb-1">Today&apos;s Prompt</p>
            <p className="text-sm font-medium text-bloom-deep mb-4">{todayPrompt}</p>
          </div>
        </BlurFade>

        {/* Three Things Input */}
        <BlurFade delay={0.3}>
          <div className="card-bloom p-5">
            <p className="text-xs font-bold text-bloom-deep/50 uppercase tracking-wider mb-3">3 things I&apos;m grateful for</p>
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-bloom-lavender/20 flex items-center justify-center text-xs font-bold text-bloom-lavender">{i + 1}</span>
                  <input
                    type="text"
                    value={entry}
                    onChange={(e) => updateEntry(i, e.target.value)}
                    placeholder={["A person...", "A moment...", "A feeling..."][i]}
                    className="flex-1 px-4 py-3 rounded-xl bg-bloom-cream/50 border border-bloom-lavender/15 text-sm text-bloom-deep placeholder-bloom-deep/25 focus:outline-none focus:ring-2 focus:ring-bloom-lavender/30 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* Free Write */}
        <BlurFade delay={0.35}>
          <div className="card-bloom p-5">
            <p className="text-xs font-bold text-bloom-deep/50 uppercase tracking-wider mb-3">Free write (optional)</p>
            <textarea
              value={freeWrite}
              onChange={(e) => setFreeWrite(e.target.value)}
              placeholder="Write anything that's on your heart today..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-bloom-cream/50 border border-bloom-lavender/15 text-sm text-bloom-deep placeholder-bloom-deep/25 resize-none focus:outline-none focus:ring-2 focus:ring-bloom-lavender/30 transition-all leading-relaxed"
            />
          </div>
        </BlurFade>

        {/* Save Button */}
        <BlurFade delay={0.4}>
          <motion.button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              saved ? "bg-bloom-mint/30 text-bloom-forest" : "bg-gradient-to-r from-bloom-lavender to-bloom-dusk text-white shadow-bloom"
            }`}
            whileHover={{ scale: saved ? 1 : 1.02 }}
            whileTap={{ scale: saved ? 1 : 0.98 }}
          >
            {saved ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>🌹 Saved! A Memory Rose grew in your garden</motion.span>
            ) : (
              <><Send size={18} /> Save Gratitude</>
            )}
          </motion.button>
        </BlurFade>

        {/* History Toggle */}
        <BlurFade delay={0.45}>
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between card-bloom p-4">
            <span className="text-sm font-bold text-bloom-deep/60">Past Entries ({history.length})</span>
            <ChevronDown size={16} className={`text-bloom-deep/30 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
        </BlurFade>

        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
              {history.map((h, i) => (
                <div key={i} className="card-bloom p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{h.emoji}</span>
                    <span className="text-xs text-bloom-deep/40">{h.date}</span>
                  </div>
                  {h.entries.map((e, j) => (
                    <p key={j} className="text-xs text-bloom-deep/70 ml-7">• {e}</p>
                  ))}
                </div>
              ))}
              {history.length === 0 && <p className="text-xs text-bloom-deep/40 text-center py-4">No entries yet. Start writing!</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}

export default GratitudePage;
