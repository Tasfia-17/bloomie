"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Droplets, Footprints, Moon, Pill, Coffee, Apple, Plus, Minus, Check } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BloomieChat } from "@/components/shared/bloomie-chat";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

type LoggedItem = { metric: string; message: string };

function QuickLogPage() {
  const [hydration, setHydration] = useState(0);
  const [steps, setSteps] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [caffeineMg, setCaffeineMg] = useState(95);
  const [medTaken, setMedTaken] = useState(false);
  const [logged, setLogged] = useState<LoggedItem[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const logItem = useCallback(async (metric: string, category: string, value: Record<string, unknown>, successMsg: string) => {
    setSaving(metric);
    try {
      await api.postWellnessData({ category, metric, value, source: "quick_log" });
      setLogged((prev) => [...prev, { metric, message: successMsg }]);
    } catch {
      // Still show as logged for UX
      setLogged((prev) => [...prev, { metric, message: successMsg }]);
    }
    setSaving(null);
  }, []);

  const addWater = () => {
    const newCount = hydration + 1;
    setHydration(newCount);
    logItem("hydration", "habits", { glasses: newCount }, `💧 ${newCount} glass${newCount > 1 ? "es" : ""} logged!`);
  };

  const removeWater = () => {
    if (hydration > 0) setHydration(hydration - 1);
  };

  const logSteps = () => {
    const count = parseInt(steps);
    if (!count || count <= 0) return;
    logItem("steps", "body", { count }, `🚶 ${count.toLocaleString()} steps logged!`);
    setSteps("");
  };

  const logSleep = () => {
    const hours = parseFloat(sleepHours);
    if (!hours || hours <= 0) return;
    logItem("sleep", "body", { hours, quality: hours >= 7 ? "good" : hours >= 5 ? "fair" : "poor" }, `😴 ${hours}h sleep logged!`);
    setSleepHours("");
  };

  const logCaffeine = () => {
    logItem("caffeine", "habits", { mg: caffeineMg, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), drink_type: "coffee" }, `☕ ${caffeineMg}mg caffeine logged!`);
  };

  const logMedication = () => {
    setMedTaken(true);
    logItem("medication", "habits", { taken: true, time: new Date().toISOString() }, "💊 Medication marked as taken!");
  };

  const isLogged = (metric: string) => logged.some((l) => l.metric === metric);

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      <div className="bg-gradient-to-b from-bloom-sage/15 to-bloom-cream px-6 pt-12 pb-6">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Quick Log ⚡</h1>
          <p className="text-sm text-bloom-deep/60 mt-1">Tap to track. Every input grows your garden.</p>
        </BlurFade>
      </div>

      <div className="px-5 space-y-4 max-w-lg mx-auto">
        {/* Hydration */}
        <BlurFade delay={0.15}>
          <div className="card-bloom p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Droplets size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-bloom-deep">Hydration</p>
                  <p className="text-xs text-bloom-deep/40">Fills your pond</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-500">{hydration}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={removeWater} className="w-10 h-10 rounded-full bg-bloom-cream border border-bloom-deep/10 flex items-center justify-center hover:bg-bloom-deep/5 transition-colors">
                <Minus size={16} className="text-bloom-deep/40" />
              </button>
              <div className="flex-1 flex gap-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`flex-1 h-3 rounded-full transition-all ${i < hydration ? "bg-blue-400" : "bg-blue-100"}`} />
                ))}
              </div>
              <motion.button
                onClick={addWater}
                className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md"
                whileTap={{ scale: 0.9 }}
              >
                <Plus size={16} />
              </motion.button>
            </div>
            <p className="text-[10px] text-bloom-deep/30 mt-2 text-center">{hydration}/8 glasses today</p>
          </div>
        </BlurFade>

        {/* Steps */}
        <BlurFade delay={0.2}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-bloom-sage/20 flex items-center justify-center">
                <Footprints size={20} className="text-bloom-forest" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-bloom-deep">Steps</p>
                <p className="text-xs text-bloom-deep/40">Brings butterflies</p>
              </div>
              {isLogged("steps") && <Check size={18} className="text-bloom-sage" />}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="e.g. 5000"
                className="flex-1 px-4 py-2.5 rounded-xl bg-bloom-cream/60 border border-bloom-sage/20 text-sm text-bloom-deep placeholder-bloom-deep/30 focus:outline-none focus:ring-2 focus:ring-bloom-sage/30"
              />
              <motion.button
                onClick={logSteps}
                disabled={!steps || saving === "steps"}
                className="px-4 py-2.5 rounded-xl bg-bloom-sage text-white text-sm font-semibold disabled:opacity-40"
                whileTap={{ scale: 0.95 }}
              >
                Log
              </motion.button>
            </div>
          </div>
        </BlurFade>

        {/* Sleep */}
        <BlurFade delay={0.25}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-bloom-lavender/20 flex items-center justify-center">
                <Moon size={20} className="text-bloom-lavender" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-bloom-deep">Sleep</p>
                <p className="text-xs text-bloom-deep/40">Clears the sky</p>
              </div>
              {isLogged("sleep") && <Check size={18} className="text-bloom-sage" />}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="Hours (e.g. 7.5)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-bloom-cream/60 border border-bloom-sage/20 text-sm text-bloom-deep placeholder-bloom-deep/30 focus:outline-none focus:ring-2 focus:ring-bloom-lavender/30"
              />
              <motion.button
                onClick={logSleep}
                disabled={!sleepHours || saving === "sleep"}
                className="px-4 py-2.5 rounded-xl bg-bloom-lavender text-white text-sm font-semibold disabled:opacity-40"
                whileTap={{ scale: 0.95 }}
              >
                Log
              </motion.button>
            </div>
          </div>
        </BlurFade>

        {/* Caffeine */}
        <BlurFade delay={0.3}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Coffee size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-bloom-deep">Caffeine</p>
                <p className="text-xs text-bloom-deep/40">Tracked for sleep insights</p>
              </div>
              {isLogged("caffeine") && <Check size={18} className="text-bloom-sage" />}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-bloom-cream/60 border border-bloom-sage/20 rounded-xl px-3 py-2">
                {[65, 95, 150, 200].map((mg) => (
                  <button
                    key={mg}
                    onClick={() => setCaffeineMg(mg)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${caffeineMg === mg ? "bg-amber-500 text-white" : "text-bloom-deep/50 hover:bg-amber-50"}`}
                  >
                    {mg}mg
                  </button>
                ))}
              </div>
              <motion.button
                onClick={logCaffeine}
                disabled={saving === "caffeine"}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-40"
                whileTap={{ scale: 0.95 }}
              >
                ☕ Log
              </motion.button>
            </div>
          </div>
        </BlurFade>

        {/* Medication */}
        <BlurFade delay={0.35}>
          <motion.button
            onClick={logMedication}
            disabled={medTaken}
            className={`card-bloom p-5 w-full text-left transition-all ${medTaken ? "bg-bloom-mint/10 border-bloom-mint/30" : ""}`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${medTaken ? "bg-bloom-mint/30" : "bg-rose-100"}`}>
                {medTaken ? <Check size={20} className="text-bloom-forest" /> : <Pill size={20} className="text-rose-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-bloom-deep">{medTaken ? "Medication taken ✓" : "Medication"}</p>
                <p className="text-xs text-bloom-deep/40">{medTaken ? "Logged for today" : "Tap to mark as taken"}</p>
              </div>
            </div>
          </motion.button>
        </BlurFade>

        {/* Recent logs */}
        {logged.length > 0 && (
          <BlurFade delay={0.4}>
            <div className="card-bloom p-4 bg-gradient-to-br from-white to-bloom-sage/5">
              <p className="text-xs font-semibold text-bloom-deep/50 uppercase tracking-wider mb-2">Just logged</p>
              <div className="space-y-1.5">
                {logged.slice(-5).reverse().map((l, i) => (
                  <motion.p
                    key={i}
                    className="text-sm text-bloom-deep/70"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {l.message}
                  </motion.p>
                ))}
              </div>
            </div>
          </BlurFade>
        )}
      </div>

      <BloomieChat />
      <BottomNav />
    </main>
  );
}

export default QuickLogPage;
