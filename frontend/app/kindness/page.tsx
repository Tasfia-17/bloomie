"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, RefreshCw, Send, Gift, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";

// Random acts of kindness bingo
const KINDNESS_BINGO = [
  "Compliment a stranger", "Hold a door open", "Text a friend you miss",
  "Leave a nice review", "Let someone go first", "Share your snack",
  "Say thank you extra", "Smile at everyone", "Write a kind note",
  "Call a family member", "Tip extra generously", "Help without being asked",
  "Send a voice message", "Forgive someone", "Donate something",
  "Give a genuine hug", "Listen without advice", "Celebrate someone",
  "Clean up after others", "Tell someone why they matter", "Buy someone coffee",
  "Leave an encouraging comment", "Volunteer 30 minutes", "Share knowledge freely",
  "FREE 🌸",
];

// Bloomie compliments
const COMPLIMENTS = [
  "You showed up today, and that matters more than you know. 🌱",
  "Your existence makes the world a gentler place. 🦋",
  "The way you care about others? It's genuinely beautiful. 💜",
  "You're stronger than the voice that says you're not. 💪",
  "Someone out there is grateful you exist. I guarantee it. 🌸",
  "Your laugh could probably heal a small garden. Just saying. 🌿",
  "You deserve rest as much as you deserve success. 🌙",
  "Every time you choose kindness, a butterfly gets its wings. 🦋",
  "You're not behind. You're on your own path. And it's lovely. 🌷",
  "The fact that you're trying? That IS the accomplishment. ⭐",
  "Your heart is bigger than you give yourself credit for. ❤️",
  "Somewhere in the universe, a star is named after your smile. ✨",
  "You make the ordinary extraordinary. Just by being you. 🌈",
  "The world needs exactly what you have to offer. Don't hold back. 🔥",
  "If kindness was currency, you'd be a billionaire. 💎",
];

function KindnessPage() {
  const [bingoState, setBingoState] = useState<boolean[]>(new Array(25).fill(false));
  const [compliment, setCompliment] = useState("");
  const [showNewCompliment, setShowNewCompliment] = useState(false);
  const [gratitudeMsg, setGratitudeMsg] = useState("");
  const [gratitudeRecipient, setGratitudeRecipient] = useState("");
  const [gratitudeSent, setGratitudeSent] = useState(false);
  const [activeTab, setActiveTab] = useState<"bingo" | "compliment" | "send">("compliment");

  useEffect(() => {
    // Daily compliment based on date
    const day = new Date().getDate() + new Date().getMonth() * 31;
    setCompliment(COMPLIMENTS[day % COMPLIMENTS.length]);

    // Load bingo state from localStorage
    try {
      const saved = localStorage.getItem("bloomie_bingo");
      if (saved) setBingoState(JSON.parse(saved));
    } catch { /* use default */ }
  }, []);

  const toggleBingo = (index: number) => {
    const newState = [...bingoState];
    newState[index] = !newState[index];
    setBingoState(newState);
    localStorage.setItem("bloomie_bingo", JSON.stringify(newState));
  };

  const shuffleCompliment = () => {
    setShowNewCompliment(true);
    const random = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    setCompliment(random);
    setTimeout(() => setShowNewCompliment(false), 300);
  };

  const sendGratitude = () => {
    if (!gratitudeMsg.trim()) return;
    setGratitudeSent(true);
    setTimeout(() => { setGratitudeSent(false); setGratitudeMsg(""); setGratitudeRecipient(""); }, 3000);
  };

  const bingoCompleted = bingoState.filter(Boolean).length;
  const hasBingo = checkBingo(bingoState);

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-rose/10 via-bloom-cream to-bloom-peach/10 pb-24">
      <div className="px-6 pt-12 pb-4">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Kindness Corner 💜</h1>
          <p className="text-sm text-bloom-deep/50 mt-1">Spread joy, receive joy, grow your garden</p>
        </BlurFade>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-soft">
          {[
            { id: "compliment" as const, label: "Compliment", emoji: "🌸" },
            { id: "bingo" as const, label: "Kindness Bingo", emoji: "🎯" },
            { id: "send" as const, label: "Send Love", emoji: "💌" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.id ? "bg-bloom-rose/20 text-bloom-deep" : "text-bloom-deep/40"
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* Compliment Tab */}
          {activeTab === "compliment" && (
            <motion.div key="compliment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="card-bloom p-8 text-center bg-gradient-to-br from-white to-bloom-rose/10 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Sparkles size={16} className="text-bloom-rose/30" />
                </div>
                <motion.span className="text-4xl block mb-4" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                  🌸
                </motion.span>
                <p className="text-xs font-bold text-bloom-deep/40 uppercase tracking-wider mb-3">Bloomie says...</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={compliment}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-base font-medium text-bloom-deep leading-relaxed italic"
                  >
                    &ldquo;{compliment}&rdquo;
                  </motion.p>
                </AnimatePresence>
              </div>

              <motion.button
                onClick={shuffleCompliment}
                className="w-full py-3.5 rounded-2xl bg-white border border-bloom-rose/20 text-bloom-deep font-semibold flex items-center justify-center gap-2 hover:bg-bloom-rose/5 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={16} className="text-bloom-rose" />
                Another one 🌸
              </motion.button>

              <div className="card-bloom p-5 text-center">
                <p className="text-xs text-bloom-deep/40 mb-2">Share this with someone who needs it</p>
                <motion.button
                  onClick={() => { if (navigator.share) navigator.share({ text: compliment }); }}
                  className="px-6 py-2.5 rounded-xl bg-bloom-rose/20 text-bloom-deep font-semibold text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  Share 💌
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Bingo Tab */}
          {activeTab === "bingo" && (
            <motion.div key="bingo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm font-bold text-bloom-deep">{bingoCompleted}/25 acts completed</p>
                {hasBingo && <p className="text-xs text-bloom-sage font-bold mt-1">🎉 BINGO! You got a line!</p>}
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {KINDNESS_BINGO.map((act, i) => (
                  <motion.button
                    key={i}
                    onClick={() => toggleBingo(i)}
                    className={`aspect-square rounded-xl text-center p-1 flex items-center justify-center transition-all ${
                      bingoState[i]
                        ? "bg-bloom-sage/30 border-2 border-bloom-sage"
                        : "bg-white border border-bloom-deep/5 hover:border-bloom-sage/30"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {bingoState[i] ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-lg">✅</motion.span>
                    ) : (
                      <span className="text-[8px] leading-tight text-bloom-deep/60 font-medium">{act}</span>
                    )}
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={() => { setBingoState(new Array(25).fill(false)); localStorage.removeItem("bloomie_bingo"); }}
                className="w-full py-2.5 rounded-xl bg-bloom-cream text-bloom-deep/50 text-xs font-semibold"
                whileTap={{ scale: 0.98 }}
              >
                Reset Board
              </motion.button>
            </motion.div>
          )}

          {/* Send Love Tab */}
          {activeTab === "send" && (
            <motion.div key="send" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="card-bloom p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={18} className="text-bloom-rose" />
                  <p className="text-sm font-bold text-bloom-deep">Send gratitude to someone</p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={gratitudeRecipient}
                    onChange={(e) => setGratitudeRecipient(e.target.value)}
                    placeholder="Who is this for? (name)"
                    className="w-full px-4 py-3 rounded-xl bg-bloom-cream/50 border border-bloom-rose/15 text-sm focus:outline-none focus:ring-2 focus:ring-bloom-rose/30"
                  />
                  <textarea
                    value={gratitudeMsg}
                    onChange={(e) => setGratitudeMsg(e.target.value)}
                    placeholder="What do you want to say? e.g. Thank you for always being there..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-bloom-cream/50 border border-bloom-rose/15 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bloom-rose/30 leading-relaxed"
                  />

                  <AnimatePresence>
                    {gratitudeSent ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                        <span className="text-3xl">💌</span>
                        <p className="text-sm font-bold text-bloom-deep mt-2">Love sent! A bird flies in your garden 🐦</p>
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={sendGratitude}
                        disabled={!gratitudeMsg.trim()}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-bloom-rose to-bloom-peach text-white font-bold flex items-center justify-center gap-2 disabled:opacity-30"
                        whileTap={{ scale: 0.98 }}
                      >
                        <Send size={16} /> Send with Love
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Quick templates */}
              <div className="card-bloom p-4">
                <p className="text-xs font-bold text-bloom-deep/40 uppercase tracking-wider mb-3">Quick messages</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Thank you for being you 💜",
                    "You brighten my day ☀️",
                    "I'm grateful for you 🌸",
                    "You inspire me 🌟",
                    "Just thinking of you 🦋",
                  ].map((msg) => (
                    <button
                      key={msg}
                      onClick={() => setGratitudeMsg(msg)}
                      className="px-3 py-1.5 rounded-full bg-bloom-peach/15 border border-bloom-peach/25 text-xs font-medium text-bloom-deep hover:bg-bloom-peach/25 transition-colors"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}

// Check if any row, column, or diagonal is complete
function checkBingo(state: boolean[]): boolean {
  // Rows
  for (let r = 0; r < 5; r++) {
    if (state.slice(r * 5, r * 5 + 5).every(Boolean)) return true;
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => state[r * 5 + c])) return true;
  }
  // Diagonals
  if ([0, 6, 12, 18, 24].every((i) => state[i])) return true;
  if ([4, 8, 12, 16, 20].every((i) => state[i])) return true;
  return false;
}

export default KindnessPage;
