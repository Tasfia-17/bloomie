"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Unlink, ExternalLink, CheckCircle2, Smartphone } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";

type Integration = {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  connected: boolean;
  color: string;
  dataTypes: string[];
  url?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "google_fit",
    name: "Google Fit",
    icon: "💚",
    description: "Steps, heart rate, sleep, workouts, and activity from your Android device",
    category: "Health & Fitness",
    connected: false,
    color: "bg-green-100 border-green-200",
    dataTypes: ["Steps", "Heart Rate", "Sleep", "Workouts", "Calories"],
    url: "https://www.google.com/fit/",
  },
  {
    id: "apple_health",
    name: "Apple Health",
    icon: "🍎",
    description: "Heart rate, sleep analysis, steps, workouts, HRV, and respiratory rate",
    category: "Health & Fitness",
    connected: false,
    color: "bg-red-50 border-red-200",
    dataTypes: ["Heart Rate", "HRV", "Sleep", "Steps", "SpO2", "Respiratory Rate"],
    url: "https://www.apple.com/health/",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    icon: "⌚",
    description: "Detailed sleep stages, activity, stress score, and wellness metrics",
    category: "Wearables",
    connected: false,
    color: "bg-teal-50 border-teal-200",
    dataTypes: ["Sleep Stages", "Steps", "Heart Rate", "Stress Score", "SpO2"],
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: "🎵",
    description: "Mood-based playlists and wellness music moments for your garden",
    category: "Wellness",
    connected: true,
    color: "bg-green-50 border-green-300",
    dataTypes: ["Playlists", "Listening History", "Mood-Based Music"],
    url: "https://open.spotify.com/",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    icon: "📅",
    description: "Find wellness breaks between meetings and manage your daily load",
    category: "Productivity",
    connected: true,
    color: "bg-blue-50 border-blue-200",
    dataTypes: ["Events", "Meeting Load", "Available Breaks"],
    url: "https://calendar.google.com/",
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: "💍",
    description: "Sleep quality, readiness score, HRV, body temperature trends",
    category: "Wearables",
    connected: false,
    color: "bg-gray-100 border-gray-200",
    dataTypes: ["Sleep Score", "Readiness", "HRV", "Temperature", "Activity"],
  },
  {
    id: "garmin",
    name: "Garmin",
    icon: "🏃",
    description: "Advanced training data, body battery, stress tracking",
    category: "Wearables",
    connected: false,
    color: "bg-blue-50 border-blue-200",
    dataTypes: ["Body Battery", "Stress", "Training Load", "Sleep", "Steps"],
  },
  {
    id: "whoop",
    name: "WHOOP",
    icon: "🔴",
    description: "Recovery score, strain, sleep performance, and HRV",
    category: "Wearables",
    connected: false,
    color: "bg-red-50 border-red-100",
    dataTypes: ["Recovery", "Strain", "Sleep Performance", "HRV"],
  },
];

function ConnectionsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setConnecting(id);

    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1500));

    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    );
    setConnecting(null);
  };

  const connectedCount = integrations.filter((i) => i.connected).length;
  const categories = [...new Set(integrations.map((i) => i.category))];

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      <div className="bg-gradient-to-b from-bloom-sky/20 to-bloom-cream px-6 pt-12 pb-6">
        <BlurFade delay={0.1}>
          <h1 className="font-display text-2xl font-bold text-bloom-deep">Connections 🔗</h1>
          <p className="text-sm text-bloom-deep/60 mt-1">
            Connect your apps to grow a richer garden
          </p>
        </BlurFade>
      </div>

      <div className="px-5 space-y-6 max-w-lg mx-auto">
        {/* Status banner */}
        <BlurFade delay={0.15}>
          <div className="card-bloom p-4 bg-gradient-to-r from-bloom-mint/10 to-bloom-sage/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bloom-sage/20 flex items-center justify-center">
                <Smartphone size={18} className="text-bloom-forest" />
              </div>
              <div>
                <p className="text-sm font-bold text-bloom-deep">
                  {connectedCount} app{connectedCount !== 1 ? "s" : ""} connected
                </p>
                <p className="text-xs text-bloom-deep/40">
                  More connections = richer garden data
                </p>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Integrations by category */}
        {categories.map((cat, catIdx) => (
          <BlurFade key={cat} delay={0.2 + catIdx * 0.05}>
            <div>
              <h2 className="text-xs font-bold text-bloom-deep/40 uppercase tracking-wider mb-3 px-1">
                {cat}
              </h2>
              <div className="space-y-3">
                {integrations
                  .filter((i) => i.category === cat)
                  .map((integration) => (
                    <div
                      key={integration.id}
                      className={`card-bloom p-4 border ${integration.connected ? "border-bloom-sage/30 bg-bloom-mint/5" : "border-bloom-deep/5"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{integration.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-bloom-deep">{integration.name}</p>
                            {integration.connected && (
                              <CheckCircle2 size={14} className="text-bloom-sage" />
                            )}
                          </div>
                          <p className="text-xs text-bloom-deep/50 mt-0.5 leading-relaxed">
                            {integration.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {integration.dataTypes.map((dt) => (
                              <span
                                key={dt}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-bloom-cream border border-bloom-deep/5 text-bloom-deep/50"
                              >
                                {dt}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Connect/Disconnect button */}
                        <motion.button
                          onClick={() => handleToggle(integration.id)}
                          disabled={connecting === integration.id}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            integration.connected
                              ? "bg-bloom-deep/5 text-bloom-deep/50 hover:bg-red-50 hover:text-red-500"
                              : "bg-bloom-forest text-white hover:bg-bloom-sage"
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {connecting === integration.id ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : integration.connected ? (
                            <>
                              <Unlink size={12} />
                              <span className="hidden sm:inline">Disconnect</span>
                            </>
                          ) : (
                            <>
                              <Link2 size={12} />
                              Connect
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </BlurFade>
        ))}

        {/* How it works */}
        <BlurFade delay={0.5}>
          <div className="card-bloom p-5 bg-gradient-to-br from-white to-bloom-lavender/10">
            <h3 className="text-sm font-bold text-bloom-deep mb-3">How connections work</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-base">🔒</span>
                <p className="text-xs text-bloom-deep/60 leading-relaxed">
                  Your data stays encrypted. We only read what you allow and never share with third parties.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-base">🌳</span>
                <p className="text-xs text-bloom-deep/60 leading-relaxed">
                  Connected apps automatically feed your garden. More data means more accurate insights.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-base">🔌</span>
                <p className="text-xs text-bloom-deep/60 leading-relaxed">
                  Disconnect anytime. Your garden keeps what it learned but stops receiving new data.
                </p>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>

      <BottomNav />
    </main>
  );
}

export default ConnectionsPage;
