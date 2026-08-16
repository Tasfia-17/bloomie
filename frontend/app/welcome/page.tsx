"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Scene3DErrorBoundary } from "@/components/shared/scene-error-boundary";

const LandingScene3D = dynamic(
  () => import("@/components/landing/landing-scene-3d").then((m) => m.LandingScene3D),
  { ssr: false, loading: () => <div className="scene-canvas landing-gradient-bg" /> }
);

function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Full-screen 3D Scene */}
      <Scene3DErrorBoundary>
        <LandingScene3D />
      </Scene3DErrorBoundary>

      {/* Gradient overlay at bottom for text readability */}
      <div className="fixed bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none z-[1]" />

      {/* Floating particles */}
      <div className="fixed inset-0 z-[2] pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-xl opacity-40"
            style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 5 + i * 0.7, repeat: Infinity, delay: i * 0.5 }}
          >
            {["🌸", "🦋", "✨", "🌿", "🐰", "🌷"][i]}
          </motion.span>
        ))}
      </div>

      {/* Minimal content overlay */}
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-end pb-16 px-6 pointer-events-none">
        {/* Logo and tagline - floating at top */}
        <motion.div
          className="absolute top-12 left-0 right-0 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <motion.span
            className="text-5xl block mb-2"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🌸
          </motion.span>
          <h1 className="font-display text-4xl font-bold text-white drop-shadow-lg tracking-tight">
            Bloomie
          </h1>
        </motion.div>

        {/* Bottom CTA section */}
        <motion.div
          className="w-full max-w-sm text-center pointer-events-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <p className="text-white/80 text-base font-medium mb-8 drop-shadow-md">
            Your wellness grows a living world
          </p>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <motion.button
              onClick={() => router.push("/signup")}
              className="w-full py-4 rounded-2xl bg-white text-bloom-deep font-bold text-lg shadow-xl"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Growing 🌱
            </motion.button>

            <motion.button
              onClick={() => router.push("/login")}
              className="w-full py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold text-base"
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.25)" }}
              whileTap={{ scale: 0.97 }}
            >
              I have a garden
            </motion.button>
          </div>

          {/* Subtle feature hints */}
          <motion.div
            className="flex items-center justify-center gap-4 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            <span className="text-white/40 text-xs">3D Garden</span>
            <span className="text-white/20">|</span>
            <span className="text-white/40 text-xs">AI Companion</span>
            <span className="text-white/20">|</span>
            <span className="text-white/40 text-xs">Wellness Track</span>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default LandingPage;
