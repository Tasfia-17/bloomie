"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, Check } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";

const STRETCHES = [
  { name: "Neck Roll", emoji: "🙆", duration: 20, instruction: "Slowly roll your head in a circle. 5 times each direction.", bodyPart: "neck" },
  { name: "Shoulder Shrug", emoji: "🤷", duration: 15, instruction: "Raise shoulders to ears, hold 3 seconds, release. Repeat 5 times.", bodyPart: "shoulders" },
  { name: "Chest Opener", emoji: "🦅", duration: 20, instruction: "Clasp hands behind back, lift chest up, squeeze shoulder blades together.", bodyPart: "chest" },
  { name: "Seated Twist", emoji: "🔄", duration: 20, instruction: "Sit tall, twist right for 10 seconds, then left for 10 seconds.", bodyPart: "spine" },
  { name: "Forward Fold", emoji: "🙇", duration: 20, instruction: "Stand up, bend forward, let arms hang. Breathe deeply.", bodyPart: "back" },
  { name: "Wrist Circles", emoji: "🤙", duration: 15, instruction: "Circle each wrist 10 times in each direction. Great for typing hands!", bodyPart: "wrists" },
  { name: "Hip Opener", emoji: "🧘", duration: 25, instruction: "Stand on one leg, pull opposite knee to chest. Hold 10 seconds each side.", bodyPart: "hips" },
  { name: "Calf Raise", emoji: "🦶", duration: 15, instruction: "Rise up on your toes, hold 3 seconds, lower. 10 times.", bodyPart: "calves" },
  { name: "Deep Breath", emoji: "🌬️", duration: 15, instruction: "Stand tall. Inhale deeply for 4, hold for 4, exhale for 6. Repeat 3 times.", bodyPart: "full body" },
];

function StretchPage() {
  const [isActive, setIsActive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STRETCHES[0].duration);
  const [completed, setCompleted] = useState<number[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const current = STRETCHES[currentIdx];
  const totalTime = STRETCHES.reduce((a, s) => a + s.duration, 0);
  const completedTime = completed.reduce((a, i) => a + STRETCHES[i].duration, 0);

  useEffect(() => {
    if (!isActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next
          const newCompleted = [...completed, currentIdx];
          setCompleted(newCompleted);

          if (currentIdx >= STRETCHES.length - 1) {
            setSessionDone(true);
            setIsActive(false);
            return 0;
          }

          const nextIdx = currentIdx + 1;
          setCurrentIdx(nextIdx);
          return STRETCHES[nextIdx].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, currentIdx, completed]);

  const togglePlay = () => setIsActive(!isActive);
  const skipNext = () => {
    if (currentIdx < STRETCHES.length - 1) {
      setCompleted([...completed, currentIdx]);
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setTimeLeft(STRETCHES[nextIdx].duration);
    }
  };
  const reset = () => {
    setIsActive(false);
    setCurrentIdx(0);
    setTimeLeft(STRETCHES[0].duration);
    setCompleted([]);
    setSessionDone(false);
  };

  // Ring progress
  const progress = current.duration > 0 ? (current.duration - timeLeft) / current.duration : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-mint/20 via-bloom-cream to-bloom-sage/10 pb-24">
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-bloom-deep">Stretch Break 🧘</h1>
            <p className="text-sm text-bloom-deep/50 mt-1">{Math.ceil(totalTime / 60)} min guided routine</p>
          </div>
          <button onClick={reset} className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
            <RotateCcw size={18} className="text-bloom-deep/40" />
          </button>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {!sessionDone ? (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Progress indicator */}
              <div className="flex gap-1">
                {STRETCHES.map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                    completed.includes(i) ? "bg-bloom-sage" : i === currentIdx ? "bg-bloom-forest" : "bg-bloom-deep/10"
                  }`} />
                ))}
              </div>

              {/* Current stretch card */}
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-bloom p-8 text-center relative overflow-hidden"
              >
                {/* Background accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-bloom-mint/5 to-bloom-sage/5 rounded-[1.5rem]" />

                <div className="relative z-10">
                  {/* Timer ring */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E8F5E9" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#5B8C5A" strokeWidth="2.5" strokeDasharray={`${progress * 100}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span className="text-4xl" animate={isActive ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}>
                        {current.emoji}
                      </motion.span>
                      <span className="text-lg font-bold text-bloom-deep mt-1">{timeLeft}s</span>
                    </div>
                  </div>

                  {/* Stretch info */}
                  <h2 className="text-xl font-bold text-bloom-deep mb-2">{current.name}</h2>
                  <p className="text-xs text-bloom-deep/40 uppercase tracking-wider mb-3">{current.bodyPart}</p>
                  <p className="text-sm text-bloom-deep/70 leading-relaxed max-w-xs mx-auto">{current.instruction}</p>
                </div>
              </motion.div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-bloom-forest text-white flex items-center justify-center shadow-bloom-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </motion.button>
                <motion.button
                  onClick={skipNext}
                  className="w-12 h-12 rounded-full bg-white border border-bloom-sage/20 flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <SkipForward size={18} className="text-bloom-deep/50" />
                </motion.button>
              </div>

              {/* Upcoming */}
              <div className="card-bloom p-4">
                <p className="text-xs font-bold text-bloom-deep/40 uppercase tracking-wider mb-2">Coming up</p>
                <div className="space-y-2">
                  {STRETCHES.slice(currentIdx + 1, currentIdx + 3).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-lg">{s.emoji}</span>
                      <span className="text-bloom-deep/60 font-medium">{s.name}</span>
                      <span className="text-bloom-deep/30 text-xs ml-auto">{s.duration}s</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4">
              <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <span className="text-7xl block">🧘</span>
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-bloom-deep">Stretch Complete!</h2>
              <p className="text-sm text-bloom-deep/50">
                {STRETCHES.length} stretches in {Math.ceil(totalTime / 60)} minutes. Your body thanks you!
              </p>
              <p className="text-xs text-bloom-sage font-semibold">🌲 A Strength Sapling grew in your garden</p>

              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {STRETCHES.map((s, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-bloom-mint/20 flex items-center justify-center">
                    <span className="text-sm">{s.emoji}</span>
                  </div>
                ))}
              </div>

              <motion.button onClick={reset} className="mt-6 px-6 py-3 rounded-xl bg-bloom-forest text-white font-bold" whileTap={{ scale: 0.95 }}>
                Do Again 🔄
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}

export default StretchPage;
