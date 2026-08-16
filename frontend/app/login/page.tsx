"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { setBloomieUser } from "@/lib/auth";
import { Scene3DErrorBoundary } from "@/components/shared/scene-error-boundary";

type FlyTarget = "garden" | "today" | "insights" | "nest";
type FlyToFn = (target: FlyTarget) => Promise<void>;

const LandingScene3D = dynamic(
  () => import("@/components/landing/landing-scene-3d").then((m) => m.LandingScene3D),
  { ssr: false, loading: () => <div className="scene-canvas bg-bloom-sky/40" /> }
);

const DEMO_USERS: Record<string, { password: string; name: string; id: string }> = {
  "bloom@bloomie.app": { password: "garden123", name: "Bloom Gardener", id: "demo" },
  "lily@bloomie.app": { password: "bloom123", name: "Lily Wellness", id: "demo-lily" },
};

function LoginPage() {
  const router = useRouter();
  const flyToRef = useRef<FlyToFn | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const flyAndNavigate = useCallback(async () => {
    if (flyToRef.current) {
      setIsTransitioning(true);
      await flyToRef.current("garden");
    }
    router.push("/");
  }, [router]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      const trimmedEmail = email.toLowerCase().trim();

      // Check demo accounts
      const demoUser = DEMO_USERS[trimmedEmail];
      if (demoUser && demoUser.password === password) {
        setBloomieUser({ email: trimmedEmail, name: demoUser.name, id: demoUser.id });
        await flyAndNavigate();
        return;
      }

      // Check localStorage accounts (signed-up users)
      try {
        const storedUsers: Record<string, { password: string; name: string; id: string }> = JSON.parse(
          localStorage.getItem("bloomie_users") || "{}"
        );
        const storedUser = storedUsers[trimmedEmail];
        if (storedUser && storedUser.password === password) {
          setBloomieUser({ email: trimmedEmail, name: storedUser.name, id: storedUser.id });
          await flyAndNavigate();
          return;
        }
      } catch {
        // localStorage unavailable
      }

      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
    },
    [email, password, flyAndNavigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-bloom-sky/40">
      {/* 3D Scene Background */}
      <Scene3DErrorBoundary>
        <LandingScene3D flyToRef={flyToRef} />
      </Scene3DErrorBoundary>

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

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="text-5xl mb-3"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            🌸
          </motion.div>
          <h1 className="font-display text-4xl font-bold text-bloom-deep tracking-tight">Bloomie</h1>
          <p className="text-sm text-bloom-deep/60 font-medium mt-1">
            Your little world for a healthier life.
          </p>
        </div>

        {/* Login card */}
        <div className="glass-strong p-8 shadow-bloom-lg">
          <h2 className="text-xl font-bold text-bloom-deep mb-1">Welcome back 🌱</h2>
          <p className="text-sm text-bloom-deep/50 mb-6">Sign in to visit your garden</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-bloom-deep/80 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bloomie.app"
                required
                className="w-full px-4 py-3 rounded-xl bg-bloom-cream/60 border border-bloom-sage/20 text-base text-bloom-deep placeholder-bloom-deep/30 focus:outline-none focus:ring-2 focus:ring-bloom-sage/40 focus:border-bloom-sage/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-bloom-deep/80 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-xl bg-bloom-cream/60 border border-bloom-sage/20 text-base text-bloom-deep placeholder-bloom-deep/30 focus:outline-none focus:ring-2 focus:ring-bloom-sage/40 focus:border-bloom-sage/40 transition-all"
              />
            </div>

            {error && (
              <motion.p
                className="text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-2.5"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-bloom-sage to-bloom-forest text-white font-bold text-base shadow-bloom disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entering garden...
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-bloom-sage/15">
            <p className="text-xs font-semibold text-bloom-deep/40 uppercase tracking-wider mb-3">
              Demo Accounts
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { setEmail("bloom@bloomie.app"); setPassword("garden123"); setError(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bloom-mint/20 border border-bloom-mint/30 text-left hover:bg-bloom-mint/30 transition-colors"
              >
                <span className="text-2xl">🌳</span>
                <div>
                  <p className="text-sm font-bold text-bloom-deep">Bloom Gardener</p>
                  <p className="text-xs text-bloom-forest/60">Full garden with wellness data</p>
                </div>
              </button>
              <button
                onClick={() => { setEmail("lily@bloomie.app"); setPassword("bloom123"); setError(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bloom-lavender/15 border border-bloom-lavender/30 text-left hover:bg-bloom-lavender/25 transition-colors"
              >
                <span className="text-2xl">🌷</span>
                <div>
                  <p className="text-sm font-bold text-bloom-deep">Lily Wellness</p>
                  <p className="text-xs text-bloom-lavender">Fresh start garden</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-bloom-deep/60">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-bloom-forest font-semibold hover:text-bloom-sage transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
