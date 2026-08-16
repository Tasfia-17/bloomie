"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ONBOARDING_STEPS = [
  {
    emoji: "🌸",
    title: "Welcome to Bloomie",
    subtitle: "Your little world for a healthier life",
    description: "Bloomie turns your wellness data into a living garden. No charts. No notifications. Just a world that grows with you.",
    bg: "from-bloom-sky/30 to-bloom-mint/20",
    particles: ["🌸", "🌷", "✨", "🌱"],
  },
  {
    emoji: "🌳",
    title: "Your Garden is Alive",
    subtitle: "Every metric becomes something beautiful",
    description: "Sleep affects the sky. Activity brings butterflies. Hydration fills the pond. Your wellness literally grows your world.",
    bg: "from-bloom-sage/20 to-bloom-mint/30",
    details: [
      { icon: "😴", text: "Sleep → Sky clarity" },
      { icon: "🚶", text: "Activity → Butterflies" },
      { icon: "💧", text: "Hydration → Pond" },
      { icon: "💌", text: "Social → Birds" },
      { icon: "🧘", text: "Mindfulness → Fireflies" },
    ],
  },
  {
    emoji: "🏆",
    title: "Quests & Growth",
    subtitle: "Small actions, big garden",
    description: "Complete daily wellness quests to unlock new garden items. Your world expands as your wellness consistency grows.",
    bg: "from-bloom-yellow/20 to-bloom-peach/20",
    details: [
      { icon: "💧", text: "Pond Quest — drink water" },
      { icon: "🚶", text: "5-Minute Walk" },
      { icon: "💌", text: "Connection Quest" },
      { icon: "🧘", text: "3-Minute Reset" },
    ],
  },
  {
    emoji: "🐰",
    title: "Meet Bloomie",
    subtitle: "Your personal wellness companion",
    description: "Talk to Bloomie anytime. Ask about your trends, get gentle suggestions, or just chat. Bloomie learns your patterns and adapts.",
    bg: "from-bloom-lavender/20 to-bloom-rose/10",
    particles: ["🐰", "🦋", "🐦", "💫"],
  },
];

function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      localStorage.setItem("bloomie_onboarded", "true");
      router.push("/");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("bloomie_onboarded", "true");
    router.push("/");
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b ${step.bg} relative overflow-hidden flex flex-col`}>
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {(step.particles || []).map((p, i) => (
          <motion.span
            key={`${currentStep}-${i}`}
            className="absolute text-2xl"
            style={{ left: `${15 + i * 22}%`, top: `${50 + (i % 2) * 20}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.3, 0.5],
              y: [0, -50, 0],
            }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}
          >
            {p}
          </motion.span>
        ))}
      </div>

      {/* Skip button */}
      <div className="relative z-10 flex justify-end px-6 pt-12">
        <button
          onClick={handleSkip}
          className="text-sm text-bloom-deep/40 font-semibold hover:text-bloom-deep/60 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-sm w-full"
          >
            {/* Big emoji */}
            <motion.div
              className="mb-8"
              animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="text-8xl">{step.emoji}</span>
            </motion.div>

            {/* Title */}
            <h1 className="font-display text-3xl font-bold text-bloom-deep mb-2">
              {step.title}
            </h1>
            <p className="text-sm font-semibold text-bloom-forest/60 uppercase tracking-wider mb-4">
              {step.subtitle}
            </p>
            <p className="text-sm text-bloom-deep/60 leading-relaxed mb-8">
              {step.description}
            </p>

            {/* Details list (for steps 2 and 3) */}
            {step.details && (
              <div className="space-y-2 mb-8">
                {step.details.map((d, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <span className="text-lg">{d.icon}</span>
                    <span className="text-sm font-medium text-bloom-deep">{d.text}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="relative z-10 px-8 pb-12">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep ? "w-8 bg-bloom-forest" : i < currentStep ? "w-2 bg-bloom-sage" : "w-2 bg-bloom-deep/15"
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <motion.button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-bloom-sage to-bloom-forest text-white font-bold text-lg shadow-bloom"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentStep === ONBOARDING_STEPS.length - 1 ? "Start Growing! 🌱" : "Next →"}
        </motion.button>
      </div>
    </main>
  );
}

export default OnboardingPage;
