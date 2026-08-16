"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Check } from "lucide-react";

type BreathPattern = {
  name: string;
  description: string;
  emoji: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdOut: number;
  color: string;
};

const PATTERNS: BreathPattern[] = [
  {
    name: "4-7-8 Calm",
    description: "Deep relaxation and sleep preparation",
    emoji: "🌙",
    inhale: 4,
    hold: 7,
    exhale: 8,
    holdOut: 0,
    color: "from-bloom-lavender to-bloom-dusk",
  },
  {
    name: "Box Breathing",
    description: "Focus and stress relief",
    emoji: "🧘",
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdOut: 4,
    color: "from-bloom-sage to-bloom-forest",
  },
  {
    name: "Quick Calm",
    description: "Fast anxiety relief in 2 minutes",
    emoji: "⚡",
    inhale: 3,
    hold: 3,
    exhale: 6,
    holdOut: 0,
    color: "from-bloom-mint to-bloom-ocean",
  },
  {
    name: "Energy Boost",
    description: "Wake up and energize",
    emoji: "☀️",
    inhale: 4,
    hold: 0,
    exhale: 2,
    holdOut: 0,
    color: "from-bloom-yellow to-bloom-autumn",
  },
];

type Phase = "inhale" | "hold" | "exhale" | "holdOut" | "idle";

function BreathePage() {
  const router = useRouter();
  const [selectedPattern, setSelectedPattern] = useState<BreathPattern>(PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const [targetCycles] = useState(5);
  const [showComplete, setShowComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimeRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");

  const getPhaseLabel = (p: Phase): string => {
    switch (p) {
      case "inhale": return "Breathe In";
      case "hold": return "Hold";
      case "exhale": return "Breathe Out";
      case "holdOut": return "Hold";
      default: return "Ready";
    }
  };

  const getPhaseDuration = useCallback((p: Phase): number => {
    switch (p) {
      case "inhale": return selectedPattern.inhale;
      case "hold": return selectedPattern.hold;
      case "exhale": return selectedPattern.exhale;
      case "holdOut": return selectedPattern.holdOut;
      default: return 0;
    }
  }, [selectedPattern]);

  const getNextPhase = useCallback((current: Phase): Phase => {
    switch (current) {
      case "inhale":
        return selectedPattern.hold > 0 ? "hold" : "exhale";
      case "hold":
        return "exhale";
      case "exhale":
        return selectedPattern.holdOut > 0 ? "holdOut" : "inhale";
      case "holdOut":
        return "inhale";
      default:
        return "inhale";
    }
  }, [selectedPattern]);

  const startExercise = () => {
    setIsActive(true);
    setPhase("inhale");
    setPhaseTime(selectedPattern.inhale);
    phaseTimeRef.current = selectedPattern.inhale;
    phaseRef.current = "inhale";
    setTotalCycles(0);
    setShowComplete(false);
  };

  const stopExercise = () => {
    setIsActive(false);
    setPhase("idle");
    setPhaseTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    stopExercise();
    setTotalCycles(0);
    setShowComplete(false);
  };

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      phaseTimeRef.current -= 1;
      setPhaseTime(phaseTimeRef.current);

      if (phaseTimeRef.current <= 0) {
        const nextPhase = getNextPhase(phaseRef.current);
        const nextDuration = getPhaseDuration(nextPhase);

        // Count cycle when returning to inhale
        if (nextPhase === "inhale" && phaseRef.current !== "idle") {
          setTotalCycles((prev) => {
            const newCycles = prev + 1;
            if (newCycles >= targetCycles) {
              setIsActive(false);
              setShowComplete(true);
              if (timerRef.current) clearInterval(timerRef.current);
            }
            return newCycles;
          });
        }

        phaseRef.current = nextPhase;
        phaseTimeRef.current = nextDuration;
        setPhase(nextPhase);
        setPhaseTime(nextDuration);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, getNextPhase, getPhaseDuration, targetCycles]);

  // Circle scale based on phase
  const getCircleScale = () => {
    if (!isActive) return 1;
    const duration = getPhaseDuration(phase);
    const progress = duration > 0 ? (duration - phaseTime) / duration : 0;

    switch (phase) {
      case "inhale": return 1 + progress * 0.6; // Grow to 1.6x
      case "hold": return 1.6; // Stay big
      case "exhale": return 1.6 - progress * 0.6; // Shrink to 1x
      case "holdOut": return 1; // Stay small
      default: return 1;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-bloom-deep via-bloom-night to-bloom-deep text-white relative overflow-hidden">
      {/* Ambient particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/10"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{ duration: 6 + i * 0.5, repeat: Infinity, delay: i * 0.7 }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/today")}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-lg font-bold">Breathing Exercise</h1>
          <button onClick={reset} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Pattern Selector (when not active) */}
        <AnimatePresence>
          {!isActive && !showComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mb-8"
            >
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                Choose a pattern
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PATTERNS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPattern(p)}
                    className={`p-4 rounded-2xl text-left transition-all ${
                      selectedPattern.name === p.name
                        ? "bg-white/15 ring-1 ring-white/30"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xl mb-1 block">{p.emoji}</span>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{p.description}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {p.inhale}-{p.hold}-{p.exhale}{p.holdOut > 0 ? `-${p.holdOut}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Breathing Circle */}
        <div className="relative flex items-center justify-center w-72 h-72 my-8">
          {/* Outer glow rings */}
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${selectedPattern.color} opacity-20`}
            animate={{ scale: getCircleScale() * 1.1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
          <motion.div
            className={`absolute inset-4 rounded-full bg-gradient-to-br ${selectedPattern.color} opacity-30`}
            animate={{ scale: getCircleScale() * 1.05 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />

          {/* Main circle */}
          <motion.div
            className={`absolute inset-8 rounded-full bg-gradient-to-br ${selectedPattern.color} flex items-center justify-center shadow-2xl`}
            animate={{ scale: getCircleScale() }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <div className="text-center">
              <p className="text-3xl font-bold">{isActive ? phaseTime : ""}</p>
              <p className="text-sm font-semibold opacity-80 mt-1">
                {isActive ? getPhaseLabel(phase) : "Tap to start"}
              </p>
            </div>
          </motion.div>

          {/* Cycle counter */}
          {isActive && (
            <div className="absolute -bottom-6 flex items-center gap-1">
              {[...Array(targetCycles)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i < totalCycles ? "bg-white" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        {!showComplete && (
          <motion.button
            onClick={isActive ? stopExercise : startExercise}
            className="mt-8 w-16 h-16 rounded-full bg-white/15 border border-white/20 flex items-center justify-center hover:bg-white/25 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </motion.button>
        )}

        {/* Completion state */}
        <AnimatePresence>
          {showComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-4 space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Check size={48} className="mx-auto text-bloom-mint" />
              </motion.div>
              <h2 className="text-2xl font-bold">Session Complete! ✨</h2>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                {targetCycles} cycles of {selectedPattern.name}. Your fireflies are glowing brighter!
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={startExercise}
                  className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 font-semibold"
                >
                  Again
                </button>
                <button
                  onClick={() => router.push("/garden")}
                  className="flex-1 py-3 rounded-xl bg-bloom-mint/30 font-semibold text-bloom-mint"
                >
                  Garden 🌳
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info footer */}
        {!isActive && !showComplete && (
          <motion.p
            className="text-center text-xs text-white/30 mt-12 max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Deep breathing activates your parasympathetic nervous system.
            Each session grows fireflies in your garden. ✨
          </motion.p>
        )}
      </div>
    </main>
  );
}

export default BreathePage;
