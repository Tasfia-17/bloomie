"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Heart, Brain, Apple, Footprints, Moon, Coffee, Pill, Dumbbell, Wind, BookOpen, Smile, Battery, AlertCircle } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

type Tab = "body" | "habits" | "mind" | "nutrition";
type PlantReward = { emoji: string; name: string; message: string } | null;

const TABS: { id: Tab; label: string; emoji: string; color: string }[] = [
  { id: "body", label: "Body", emoji: "❤️", color: "from-rose-400 to-rose-500" },
  { id: "habits", label: "Habits", emoji: "🌱", color: "from-bloom-sage to-bloom-forest" },
  { id: "mind", label: "Mind", emoji: "🧠", color: "from-bloom-lavender to-bloom-dusk" },
  { id: "nutrition", label: "Food", emoji: "🍎", color: "from-orange-400 to-red-400" },
];

function LogPage() {
  const [activeTab, setActiveTab] = useState<Tab>("body");
  const [plantReward, setPlantReward] = useState<PlantReward>(null);
  const [recentLogs, setRecentLogs] = useState<string[]>([]);

  const logAndPlant = useCallback(async (category: string, metric: string, value: Record<string, unknown>, label: string) => {
    try {
      await api.postWellnessData({ category, metric, value, source: "log_page" });
      // Plant a garden item
      const plantRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/garden/plant?metric=${metric}&value=${JSON.stringify(value)}&user_id=${document.cookie.match(/bloomie_user=([^;]+)/)?.[1] ? JSON.parse(decodeURIComponent(document.cookie.match(/bloomie_user=([^;]+)/)![1])).id : "demo"}`,
        { method: "POST" }
      );
      const plant = await plantRes.json();
      setPlantReward({ emoji: plant.reward?.emoji || "🌸", name: plant.reward?.name || "Bloom", message: plant.message || "Something grew!" });
      setTimeout(() => setPlantReward(null), 3000);
    } catch {
      setPlantReward({ emoji: "🌸", name: "Bloom", message: `${label} logged! 🌱` });
      setTimeout(() => setPlantReward(null), 3000);
    }
    setRecentLogs((prev) => [`${label}`, ...prev].slice(0, 5));
  }, []);

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-bloom-sage/15 to-bloom-cream px-6 pt-12 pb-4">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Log Wellness 📝</h1>
          <p className="text-sm text-bloom-deep/50 mt-1">Every entry plants something in your garden</p>
        </BlurFade>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-white rounded-2xl p-1.5 shadow-soft border border-bloom-sage/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                  : "text-bloom-deep/50 hover:text-bloom-deep"
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto space-y-3">
        <AnimatePresence mode="wait">
          {activeTab === "body" && (
            <motion.div key="body" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <LogInput icon={<Heart size={18} className="text-rose-500" />} label="Heart Rate" unit="bpm" placeholder="72" onLog={(v) => logAndPlant("body", "heart_rate", { bpm: parseFloat(v) }, `❤️ ${v} bpm`)} />
              <LogInput icon={<Moon size={18} className="text-bloom-lavender" />} label="Sleep" unit="hours" placeholder="7.5" step="0.5" onLog={(v) => logAndPlant("body", "sleep", { hours: parseFloat(v), quality: parseFloat(v) >= 7 ? "good" : "fair" }, `😴 ${v}h sleep`)} />
              <LogInput icon={<Footprints size={18} className="text-bloom-sage" />} label="Steps" unit="steps" placeholder="8000" onLog={(v) => logAndPlant("body", "steps", { count: parseInt(v) }, `🚶 ${parseInt(v).toLocaleString()} steps`)} />
              <LogInput icon={<Dumbbell size={18} className="text-bloom-forest" />} label="Exercise" unit="min" placeholder="30" onLog={(v) => logAndPlant("body", "activity_minutes", { minutes: parseInt(v) }, `💪 ${v} min exercise`)} />
              <LogInput icon={<Heart size={18} className="text-red-400" />} label="Weight" unit="kg" placeholder="65" step="0.1" onLog={(v) => logAndPlant("body", "weight", { kg: parseFloat(v) }, `⚖️ ${v} kg`)} />
            </motion.div>
          )}

          {activeTab === "habits" && (
            <motion.div key="habits" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <CounterInput icon={<Droplets size={18} className="text-blue-500" />} label="Water Glasses" max={12} onLog={(v) => logAndPlant("habits", "hydration", { glasses: v }, `💧 ${v} glasses`)} />
              <LogInput icon={<Coffee size={18} className="text-amber-600" />} label="Caffeine" unit="mg" placeholder="95" quickValues={[65, 95, 150, 200]} onLog={(v) => logAndPlant("habits", "caffeine", { mg: parseInt(v), time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), drink_type: "coffee" }, `☕ ${v}mg caffeine`)} />
              <LogInput icon={<Wind size={18} className="text-teal-500" />} label="Mindfulness" unit="min" placeholder="10" onLog={(v) => logAndPlant("habits", "mindfulness", { minutes: parseInt(v), type: "meditation" }, `🧘 ${v} min mindfulness`)} />
              <ToggleInput icon={<Pill size={18} className="text-rose-500" />} label="Medication Taken" onLog={() => logAndPlant("habits", "medication", { taken: true, time: new Date().toISOString() }, "💊 Medication taken")} />
              <LogInput icon={<Dumbbell size={18} className="text-bloom-forest" />} label="Exercise" unit="min" placeholder="20" onLog={(v) => logAndPlant("habits", "exercise", { minutes: parseInt(v), type: "general" }, `🏃 ${v} min exercise`)} />
            </motion.div>
          )}

          {activeTab === "mind" && (
            <motion.div key="mind" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <SliderInput icon={<Smile size={18} className="text-bloom-yellow" />} label="Mood" min={1} max={10} defaultVal={7} labels={["Awful", "Low", "Okay", "Good", "Great"]} onLog={(v) => logAndPlant("self_report", "mood", { score: v }, `${v >= 7 ? "😊" : v >= 5 ? "😐" : "😔"} Mood: ${v}/10`)} />
              <SliderInput icon={<Battery size={18} className="text-green-500" />} label="Energy" min={1} max={10} defaultVal={6} labels={["Drained", "Low", "Moderate", "Good", "Energized"]} onLog={(v) => logAndPlant("self_report", "energy", { score: v }, `⚡ Energy: ${v}/10`)} />
              <SliderInput icon={<AlertCircle size={18} className="text-orange-500" />} label="Stress" min={1} max={10} defaultVal={4} labels={["Calm", "Mild", "Moderate", "High", "Extreme"]} onLog={(v) => logAndPlant("self_report", "stress", { score: v }, `😤 Stress: ${v}/10`)} />
              <JournalInput icon={<BookOpen size={18} className="text-bloom-lavender" />} label="Journal" placeholder="How are you feeling today? What's on your mind?" onLog={(v) => logAndPlant("self_report", "journal", { text: v }, "📝 Journal entry saved")} />
            </motion.div>
          )}

          {activeTab === "nutrition" && (
            <motion.div key="nutrition" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <MealInput onLog={(meal) => logAndPlant("habits", "nutrition", meal, `🍽️ ${meal.meal_type} logged`)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent logs */}
        {recentLogs.length > 0 && (
          <div className="card-bloom p-4 mt-4 bg-gradient-to-br from-white to-bloom-mint/5">
            <p className="text-xs font-bold text-bloom-deep/40 uppercase tracking-wider mb-2">Recent</p>
            {recentLogs.map((log, i) => (
              <p key={i} className="text-sm text-bloom-deep/60 py-0.5">{log}</p>
            ))}
          </div>
        )}
      </div>

      {/* Plant reward popup */}
      <AnimatePresence>
        {plantReward && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
          >
            <div className="bg-white rounded-2xl px-6 py-4 shadow-bloom-xl border border-bloom-sage/20 flex items-center gap-3">
              <motion.span className="text-3xl" animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.6 }}>
                {plantReward.emoji}
              </motion.span>
              <div>
                <p className="text-sm font-bold text-bloom-deep">{plantReward.name}</p>
                <p className="text-xs text-bloom-deep/50">{plantReward.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}

// === Sub-components ===

function LogInput({ icon, label, unit, placeholder, step, quickValues, onLog }: {
  icon: React.ReactNode; label: string; unit: string; placeholder: string; step?: string;
  quickValues?: number[]; onLog: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const handleLog = () => { if (value) { onLog(value); setValue(""); } };

  return (
    <div className="card-bloom p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-bold text-bloom-deep">{label}</span>
        <span className="text-xs text-bloom-deep/30 ml-auto">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        {quickValues && (
          <div className="flex gap-1">
            {quickValues.map((qv) => (
              <button key={qv} onClick={() => { setValue(String(qv)); }} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${value === String(qv) ? "bg-bloom-sage text-white" : "bg-bloom-cream text-bloom-deep/50"}`}>{qv}</button>
            ))}
          </div>
        )}
        <input type="number" step={step || "1"} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="flex-1 px-3 py-2 rounded-xl bg-bloom-cream/60 border border-bloom-sage/15 text-sm focus:outline-none focus:ring-1 focus:ring-bloom-sage/30" />
        <motion.button onClick={handleLog} disabled={!value} className="px-4 py-2 rounded-xl bg-bloom-forest text-white text-xs font-bold disabled:opacity-30" whileTap={{ scale: 0.95 }}>
          Plant 🌱
        </motion.button>
      </div>
    </div>
  );
}

function CounterInput({ icon, label, max, onLog }: { icon: React.ReactNode; label: string; max: number; onLog: (value: number) => void }) {
  const [count, setCount] = useState(0);
  const increment = () => { const n = Math.min(count + 1, max); setCount(n); onLog(n); };

  return (
    <div className="card-bloom p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-bold text-bloom-deep">{label}</span>
        <span className="text-lg font-bold text-bloom-forest ml-auto">{count}/{max}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-0.5">
          {[...Array(max)].map((_, i) => (
            <div key={i} className={`flex-1 h-3 rounded-full transition-all ${i < count ? "bg-blue-400" : "bg-blue-100"}`} />
          ))}
        </div>
        <motion.button onClick={increment} className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold shadow-md" whileTap={{ scale: 0.85 }}>+</motion.button>
      </div>
    </div>
  );
}

function SliderInput({ icon, label, min, max, defaultVal, labels, onLog }: {
  icon: React.ReactNode; label: string; min: number; max: number; defaultVal: number; labels: string[]; onLog: (value: number) => void;
}) {
  const [value, setValue] = useState(defaultVal);
  const [logged, setLogged] = useState(false);
  const handleLog = () => { onLog(value); setLogged(true); setTimeout(() => setLogged(false), 2000); };
  const labelIdx = Math.floor(((value - min) / (max - min)) * (labels.length - 1));

  return (
    <div className="card-bloom p-4">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-sm font-bold text-bloom-deep">{label}</span>
        <span className="text-xs text-bloom-deep/40 ml-auto">{labels[labelIdx]}</span>
        <span className="text-lg font-bold text-bloom-forest">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-bloom-sage/15 accent-bloom-forest mb-3" />
      <motion.button onClick={handleLog} disabled={logged} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${logged ? "bg-bloom-mint/30 text-bloom-forest" : "bg-bloom-forest text-white"}`} whileTap={{ scale: 0.98 }}>
        {logged ? "Planted! 🌸" : "Log & Plant 🌱"}
      </motion.button>
    </div>
  );
}

function ToggleInput({ icon, label, onLog }: { icon: React.ReactNode; label: string; onLog: () => void }) {
  const [done, setDone] = useState(false);
  const handle = () => { if (!done) { setDone(true); onLog(); } };

  return (
    <motion.button onClick={handle} disabled={done} className={`card-bloom p-4 w-full text-left ${done ? "bg-bloom-mint/10 border-bloom-mint/30" : ""}`} whileTap={{ scale: 0.98 }}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-bold text-bloom-deep flex-1">{label}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-bloom-sage text-white" : "bg-bloom-cream border border-bloom-deep/10"}`}>
          {done && "✓"}
        </div>
      </div>
    </motion.button>
  );
}

function JournalInput({ icon, label, placeholder, onLog }: { icon: React.ReactNode; label: string; placeholder: string; onLog: (value: string) => void }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const handle = () => { if (text.trim()) { onLog(text.trim()); setSaved(true); setText(""); setTimeout(() => setSaved(false), 2000); } };

  return (
    <div className="card-bloom p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-bold text-bloom-deep">{label}</span>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={3} className="w-full px-3 py-2 rounded-xl bg-bloom-cream/60 border border-bloom-sage/15 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-bloom-lavender/30 mb-2" />
      <motion.button onClick={handle} disabled={!text.trim() || saved} className={`w-full py-2.5 rounded-xl text-sm font-bold ${saved ? "bg-bloom-lavender/20 text-bloom-lavender" : "bg-bloom-lavender text-white"}`} whileTap={{ scale: 0.98 }}>
        {saved ? "Saved! 🌹" : "Save & Plant 🌱"}
      </motion.button>
    </div>
  );
}

function MealInput({ onLog }: { onLog: (meal: Record<string, unknown>) => void }) {
  const [mealType, setMealType] = useState("lunch");
  const [description, setDescription] = useState("");
  const [hasProtein, setHasProtein] = useState(false);
  const [hasFiber, setHasFiber] = useState(false);
  const [hasVeggies, setHasVeggies] = useState(false);
  const [hasFruit, setHasFruit] = useState(false);
  const [saved, setSaved] = useState(false);

  const handle = () => {
    onLog({ meal_type: mealType, description, has_protein: hasProtein, has_fiber: hasFiber, has_vegetables: hasVeggies, has_fruit: hasFruit });
    setSaved(true);
    setTimeout(() => { setSaved(false); setDescription(""); setHasProtein(false); setHasFiber(false); setHasVeggies(false); setHasFruit(false); }, 2000);
  };

  return (
    <div className="card-bloom p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Apple size={18} className="text-red-500" />
        <span className="text-sm font-bold text-bloom-deep">Log a Meal</span>
      </div>

      {/* Meal type */}
      <div className="flex gap-2">
        {["breakfast", "lunch", "dinner", "snack"].map((t) => (
          <button key={t} onClick={() => setMealType(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${mealType === t ? "bg-orange-500 text-white" : "bg-bloom-cream text-bloom-deep/50"}`}>{t}</button>
        ))}
      </div>

      {/* Description */}
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you eat? (e.g. rice, chicken, salad)" className="w-full px-3 py-2.5 rounded-xl bg-bloom-cream/60 border border-bloom-sage/15 text-sm focus:outline-none focus:ring-1 focus:ring-orange-300" />

      {/* Nutrient toggles */}
      <div className="grid grid-cols-2 gap-2">
        <NutrientToggle label="Protein 🥩" active={hasProtein} onToggle={() => setHasProtein(!hasProtein)} />
        <NutrientToggle label="Fiber 🌾" active={hasFiber} onToggle={() => setHasFiber(!hasFiber)} />
        <NutrientToggle label="Vegetables 🥬" active={hasVeggies} onToggle={() => setHasVeggies(!hasVeggies)} />
        <NutrientToggle label="Fruit 🍎" active={hasFruit} onToggle={() => setHasFruit(!hasFruit)} />
      </div>

      <motion.button onClick={handle} disabled={saved} className={`w-full py-3 rounded-xl text-sm font-bold ${saved ? "bg-green-100 text-green-600" : "bg-orange-500 text-white"}`} whileTap={{ scale: 0.98 }}>
        {saved ? "Logged! 🍎" : "Log Meal & Plant 🌱"}
      </motion.button>
    </div>
  );
}

function NutrientToggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${active ? "bg-green-100 border border-green-300 text-green-700" : "bg-bloom-cream border border-bloom-deep/5 text-bloom-deep/50"}`}>
      {label}
    </button>
  );
}

export default LogPage;
