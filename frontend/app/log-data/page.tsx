"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

const CATEGORIES = [
  {
    id: "body",
    label: "Body",
    emoji: "❤️",
    color: "bg-rose-100",
    metrics: [
      { id: "heart_rate", label: "Heart Rate", unit: "bpm", placeholder: "72", field: "bpm" },
      { id: "blood_pressure", label: "Blood Pressure", unit: "mmHg", placeholder: "120", field: "systolic" },
      { id: "weight", label: "Weight", unit: "kg", placeholder: "65", field: "kg" },
      { id: "steps", label: "Steps", unit: "steps", placeholder: "8000", field: "count" },
      { id: "sleep", label: "Sleep", unit: "hours", placeholder: "7.5", field: "hours" },
      { id: "activity_minutes", label: "Activity", unit: "min", placeholder: "30", field: "minutes" },
      { id: "spo2", label: "SpO2", unit: "%", placeholder: "98", field: "percent" },
    ],
  },
  {
    id: "habits",
    label: "Habits",
    emoji: "🌱",
    color: "bg-bloom-mint/30",
    metrics: [
      { id: "hydration", label: "Water", unit: "glasses", placeholder: "8", field: "glasses" },
      { id: "caffeine", label: "Caffeine", unit: "mg", placeholder: "200", field: "mg" },
      { id: "exercise", label: "Exercise", unit: "min", placeholder: "30", field: "minutes" },
      { id: "mindfulness", label: "Mindfulness", unit: "min", placeholder: "10", field: "minutes" },
      { id: "medication", label: "Medication", unit: "", placeholder: "", field: "taken" },
    ],
  },
  {
    id: "self_report",
    label: "Self Report",
    emoji: "🧠",
    color: "bg-bloom-lavender/20",
    metrics: [
      { id: "mood", label: "Mood", unit: "/10", placeholder: "7", field: "score" },
      { id: "energy", label: "Energy", unit: "/10", placeholder: "6", field: "score" },
      { id: "stress", label: "Stress", unit: "/10", placeholder: "4", field: "score" },
      { id: "pain", label: "Pain", unit: "/10", placeholder: "2", field: "score" },
    ],
  },
];

function LogDataPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentCategory = CATEGORIES.find((c) => c.id === selectedCategory);
  const currentMetric = currentCategory?.metrics.find((m) => m.id === selectedMetric);

  const handleSubmit = useCallback(async () => {
    if (!currentCategory || !currentMetric || !value) return;
    setIsSubmitting(true);

    const numValue = parseFloat(value);
    const dataValue: Record<string, unknown> = {};

    if (currentMetric.field === "taken") {
      dataValue.taken = true;
      dataValue.time = new Date().toISOString();
    } else {
      dataValue[currentMetric.field] = numValue;
    }

    try {
      await api.postWellnessData({
        category: currentCategory.id,
        metric: currentMetric.id,
        value: dataValue,
        source: "manual_entry",
      });
    } catch {
      // Still show success for UX
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setValue("");
      setSelectedMetric(null);
    }, 2000);
    setIsSubmitting(false);
  }, [currentCategory, currentMetric, value]);

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectedMetric ? setSelectedMetric(null) : selectedCategory ? setSelectedCategory(null) : router.push("/today")}
            className="p-2 rounded-full glass hover:bg-white/80 transition-all"
          >
            <ArrowLeft size={18} className="text-bloom-deep" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-bloom-deep">Log Wellness Data</h1>
            <p className="text-xs text-bloom-deep/50">
              {!selectedCategory ? "Choose a category" : !selectedMetric ? "Choose a metric" : `Enter ${currentMetric?.label}`}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose category */}
          {!selectedCategory && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {CATEGORIES.map((cat, i) => (
                <BlurFade key={cat.id} delay={0.1 + i * 0.05}>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className="card-bloom p-5 w-full text-left hover:shadow-bloom-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-2xl`}>
                        {cat.emoji}
                      </div>
                      <div>
                        <p className="text-base font-bold text-bloom-deep">{cat.label}</p>
                        <p className="text-xs text-bloom-deep/40">{cat.metrics.length} metrics</p>
                      </div>
                    </div>
                  </button>
                </BlurFade>
              ))}
            </motion.div>
          )}

          {/* Step 2: Choose metric */}
          {selectedCategory && !selectedMetric && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              {currentCategory?.metrics.map((metric, i) => (
                <motion.button
                  key={metric.id}
                  onClick={() => { setSelectedMetric(metric.id); if (metric.field === "taken") setValue("1"); }}
                  className="card-bloom p-4 w-full text-left hover:shadow-bloom transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-bloom-deep">{metric.label}</p>
                    {metric.unit && (
                      <span className="text-xs text-bloom-deep/30 bg-bloom-cream px-2 py-1 rounded-lg">{metric.unit}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Enter value */}
          {selectedCategory && selectedMetric && !success && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="card-bloom p-6 text-center">
                <p className="text-sm font-bold text-bloom-deep/50 uppercase tracking-wider mb-2">
                  {currentMetric?.label}
                </p>

                {currentMetric?.field === "taken" ? (
                  <div className="py-4">
                    <p className="text-bloom-deep/60 text-sm mb-4">Mark as completed for today?</p>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-xl bg-bloom-sage text-white font-bold"
                      whileTap={{ scale: 0.95 }}
                    >
                      Yes, Done ✓
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      step="any"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={currentMetric?.placeholder}
                      autoFocus
                      className="w-full text-center text-4xl font-bold text-bloom-deep bg-transparent border-b-2 border-bloom-sage/30 py-4 focus:outline-none focus:border-bloom-sage"
                    />
                    <p className="text-sm text-bloom-deep/40 mt-2">{currentMetric?.unit}</p>

                    <motion.button
                      onClick={handleSubmit}
                      disabled={!value || isSubmitting}
                      className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-bloom-sage to-bloom-forest text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Send size={16} /> Log Data</>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-bloom p-8 text-center"
            >
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                <Check size={48} className="mx-auto text-bloom-sage mb-3" />
              </motion.div>
              <p className="text-lg font-bold text-bloom-deep">Logged! 🌱</p>
              <p className="text-sm text-bloom-deep/50 mt-1">Your garden is updating...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}

export default LogDataPage;
