"use client";

import { useRef, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { getBloomieUser } from "@/lib/auth";
import { Scene3DErrorBoundary } from "@/components/shared/scene-error-boundary";

type FlyTarget = "garden" | "today" | "insights" | "nest";
type FlyToFn = (target: FlyTarget) => Promise<void>;

const LandingScene3D = dynamic(
  () => import("@/components/landing/landing-scene-3d").then((m) => m.LandingScene3D),
  { ssr: false, loading: () => <div className="scene-canvas landing-gradient-bg" /> }
);

const PAGES: Array<{
  href: string;
  flyTarget: FlyTarget;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  glowColor: string;
}> = [
  {
    href: "/garden",
    flyTarget: "garden",
    icon: "🌳",
    title: "Garden",
    subtitle: "Your living world",
    description: "A 3D island that grows with your wellness. Sleep changes the sky. Activity brings butterflies.",
    gradient: "from-bloom-sage to-bloom-forest",
    glowColor: "group-hover:shadow-glow",
  },
  {
    href: "/today",
    flyTarget: "today",
    icon: "☀️",
    title: "Today",
    subtitle: "What matters now",
    description: "Body stats, Bloomie's thoughts, daily quests, and personalized wellness moments.",
    gradient: "from-bloom-yellow to-amber-400",
    glowColor: "group-hover:shadow-[0_0_24px_rgba(245,230,163,0.4)]",
  },
  {
    href: "/insights",
    flyTarget: "insights",
    icon: "📊",
    title: "Insights",
    subtitle: "Patterns & trends",
    description: "Weekly progress, AI-discovered correlations, and the 'Why?' behind every change.",
    gradient: "from-bloom-lavender to-bloom-dusk",
    glowColor: "group-hover:shadow-glow-lavender",
  },
  {
    href: "/nest",
    flyTarget: "nest",
    icon: "🪺",
    title: "Nest",
    subtitle: "People you love",
    description: "Social wellness. Check in on loved ones. Let birds carry your messages.",
    gradient: "from-bloom-peach to-bloom-rose",
    glowColor: "group-hover:shadow-glow-rose",
  },
];

function HomePageInner() {
  const router = useRouter();
  const flyToRef = useRef<FlyToFn | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const user = getBloomieUser();
  const userName = user?.name?.split(" ")[0] || "there";

  const handleCardClick = useCallback(
    async (flyTarget: FlyTarget, href: string) => {
      if (isTransitioning) return;
      if (flyToRef.current) {
        setIsTransitioning(true);
        await flyToRef.current(flyTarget);
      }
      router.push(href);
    },
    [isTransitioning, router]
  );

  return (
    <main className="min-h-screen relative overflow-hidden landing-gradient-bg">
      {/* 3D Scene Background */}
      <Scene3DErrorBoundary>
        <LandingScene3D flyToRef={flyToRef} />
      </Scene3DErrorBoundary>

      {/* Floating decorative particles */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-bloom-sage/30"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Account button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => {
            document.cookie = "bloomie_user=;path=/;max-age=0";
            router.push("/login");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full glass text-sm font-semibold text-bloom-deep hover:bg-white/80 active:scale-95 transition-all"
        >
          🌸 {userName}
        </button>
      </div>

      {/* Transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 bg-bloom-cream z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        {/* Logo Section */}
        <motion.div
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Animated bloom icon with glow */}
          <motion.div
            className="relative mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 w-20 h-20 bg-bloom-rose/20 rounded-full blur-xl animate-breathe" />
            <span className="text-7xl relative z-10 drop-shadow-lg">🌸</span>
          </motion.div>

          <h1 className="font-display text-6xl md:text-8xl font-bold text-bloom-deep tracking-tight">
            Bloomie
          </h1>
          <motion.p
            className="text-lg md:text-xl font-medium text-bloom-forest/70 mt-2 italic text-center max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your little world for a healthier life
          </motion.p>
        </motion.div>

        {/* Welcome section */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-bloom-deep">
            Welcome back, <span className="text-gradient-bloom bg-clip-text">{userName}</span>
          </h2>
          <p className="text-bloom-deep/50 mt-2 max-w-lg mx-auto leading-relaxed">
            Your garden has been growing while you were away. The pond shimmers,
            butterflies dance, and Bloomie has something new to share. 🌱
          </p>
        </motion.div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl w-full">
          {PAGES.map((item, index) => (
            <motion.div
              key={item.href}
              className={`group relative card-bloom-interactive p-6 h-full overflow-hidden ${item.glowColor}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.12, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCardClick(item.flyTarget, item.href)}
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Decorative circle */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-500 blob`} />

              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-4 shadow-bloom group-hover:shadow-bloom-lg transition-all duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {item.icon}
                </motion.div>

                <h3 className="text-xl font-bold text-bloom-deep mb-1">{item.title}</h3>
                <p className="text-xs font-semibold text-bloom-forest/50 uppercase tracking-wider mb-2">
                  {item.subtitle}
                </p>
                <p className="text-sm text-bloom-deep/60 leading-relaxed">
                  {item.description}
                </p>

                {/* Arrow */}
                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-bloom-forest opacity-60 group-hover:opacity-100 transition-opacity">
                  <span>Explore</span>
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick stats ribbon */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="glass px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bloom-sage animate-pulse" />
            <span className="text-xs font-semibold text-bloom-deep/60">Wellness Track</span>
          </div>
          <div className="glass px-4 py-2 flex items-center gap-2">
            <span className="text-sm">🌳</span>
            <span className="text-xs font-semibold text-bloom-deep/60">3D Living Garden</span>
          </div>
          <div className="glass px-4 py-2 flex items-center gap-2">
            <span className="text-sm">🧠</span>
            <span className="text-xs font-semibold text-bloom-deep/60">AI Wellness Intelligence</span>
          </div>
          <div className="glass px-4 py-2 flex items-center gap-2">
            <span className="text-sm">🐰</span>
            <span className="text-xs font-semibold text-bloom-deep/60">Personal Companion</span>
          </div>
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          className="mt-8 text-center text-xs text-bloom-deep/40 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          The garden is delightful. The intelligence underneath is serious.
          Your health data drives every leaf, every butterfly, every sunset.
        </motion.p>
      </div>
    </main>
  );
}

function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}

export default HomePage;
