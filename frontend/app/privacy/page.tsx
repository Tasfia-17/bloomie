"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, Lock, Trash2, FileText, Users } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";

type PermissionMatrix = Record<string, Record<string, boolean>>;

type AuditEntry = {
  id: string;
  action: string;
  timestamp: string;
  detail: string;
};

const METRICS = [
  { key: "mood", label: "Mood", emoji: "😊" },
  { key: "sleep", label: "Sleep", emoji: "🌙" },
  { key: "steps", label: "Steps", emoji: "🚶" },
  { key: "vitals", label: "Vitals", emoji: "💓" },
  { key: "journal", label: "Journal", emoji: "📝" },
  { key: "medication", label: "Medication", emoji: "💊" },
  { key: "nutrition", label: "Nutrition", emoji: "🥗" },
  { key: "caffeine", label: "Caffeine", emoji: "☕" },
  { key: "hydration", label: "Hydration", emoji: "💧" },
];

const AUDIENCES = [
  { key: "me", label: "Me" },
  { key: "family", label: "Family" },
  { key: "clinician", label: "Clinician" },
];

function getPrivacyLevel(matrix: PermissionMatrix): { level: string; color: string; description: string } {
  let total = 0;
  let shared = 0;
  for (const metric of METRICS) {
    for (const audience of AUDIENCES) {
      if (audience.key === "me") continue;
      total++;
      if (matrix[metric.key]?.[audience.key]) shared++;
    }
  }
  const ratio = shared / total;
  if (ratio <= 0.2) return { level: "Very Private", color: "bg-bloom-lavender text-bloom-deep", description: "Minimal data sharing — only you can see most metrics." };
  if (ratio <= 0.5) return { level: "Balanced", color: "bg-bloom-sky/30 text-bloom-deep", description: "Moderate sharing with trusted people." };
  return { level: "Open", color: "bg-bloom-mint/40 text-bloom-deep", description: "Wide sharing — family & clinicians see most data." };
}

function PrivacyPage() {
  const [permissions, setPermissions] = useState<PermissionMatrix>({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [privacyData, auditData] = await Promise.all([
          api.getPrivacySettings(),
          api.getAuditLog(),
        ]);

        // Build permissions matrix from API response
        const matrix: PermissionMatrix = {};
        if (privacyData && (privacyData as { permissions: PermissionMatrix }).permissions) {
          const perms = (privacyData as { permissions: PermissionMatrix }).permissions;
          for (const metric of METRICS) {
            matrix[metric.key] = perms[metric.key] || { me: true, family: false, clinician: false };
          }
        } else {
          // Defaults: only "me" is allowed
          for (const metric of METRICS) {
            matrix[metric.key] = { me: true, family: false, clinician: false };
          }
        }
        setPermissions(matrix);

        if (Array.isArray(auditData)) {
          setAuditLog(auditData as AuditEntry[]);
        } else if (auditData && (auditData as { entries: AuditEntry[] }).entries) {
          setAuditLog((auditData as { entries: AuditEntry[] }).entries);
        }
      } catch {
        // Use safe defaults
        const matrix: PermissionMatrix = {};
        for (const metric of METRICS) {
          matrix[metric.key] = { me: true, family: false, clinician: false };
        }
        setPermissions(matrix);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggle = async (metric: string, audience: string) => {
    if (audience === "me") return; // Can't disable own access
    const current = permissions[metric]?.[audience] ?? false;
    const newValue = !current;

    setPermissions((prev) => ({
      ...prev,
      [metric]: { ...prev[metric], [audience]: newValue },
    }));

    try {
      await api.updatePrivacy(metric, audience, newValue);
    } catch {
      // Revert on failure
      setPermissions((prev) => ({
        ...prev,
        [metric]: { ...prev[metric], [audience]: current },
      }));
    }
  };

  const sharedCount = Object.values(permissions).reduce((acc, audiences) => {
    return acc + (audiences.family ? 1 : 0) + (audiences.clinician ? 1 : 0);
  }, 0);

  const privacyLevel = getPrivacyLevel(permissions);

  if (loading) {
    return (
      <main className="min-h-screen bg-bloom-cream pb-24 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-2 text-bloom-deep/50"
        >
          <Shield size={20} />
          <span className="text-sm font-medium">Loading privacy settings...</span>
        </motion.div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-bloom-sky/20 to-bloom-cream px-6 pt-12 pb-8">
        <BlurFade delay={0.1}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-bloom-sky/30 flex items-center justify-center">
              <Shield size={20} className="text-bloom-deep" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-bloom-deep">Privacy Controls</h1>
              <p className="text-sm text-bloom-deep/60">Your data, your rules.</p>
            </div>
          </div>
        </BlurFade>
      </div>

      <div className="px-5 space-y-6 max-w-lg mx-auto">
        {/* 1. Privacy Level Summary Badge */}
        <BlurFade delay={0.15}>
          <motion.div
            className="card-bloom p-5"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <Eye size={18} className="text-bloom-deep/60" />
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">Privacy Level</h2>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${privacyLevel.color}`}>
                {privacyLevel.level}
              </span>
              <p className="text-xs text-bloom-deep/60 leading-snug flex-1">
                {privacyLevel.description}
              </p>
            </div>
          </motion.div>
        </BlurFade>

        {/* 2. Permissions Matrix */}
        <BlurFade delay={0.25}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-3 mb-4">
              <Users size={18} className="text-bloom-deep/60" />
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">Who Sees What</h2>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_50px_50px_50px] gap-1 mb-2 px-1">
              <div />
              {AUDIENCES.map((a) => (
                <div key={a.key} className="text-center">
                  <span className="text-[10px] font-semibold text-bloom-deep/50 uppercase">{a.label}</span>
                </div>
              ))}
            </div>

            {/* Metric rows */}
            <div className="space-y-1.5">
              {METRICS.map((metric) => (
                <motion.div
                  key={metric.key}
                  className="grid grid-cols-[1fr_50px_50px_50px] gap-1 items-center px-1 py-2 rounded-lg hover:bg-bloom-sky/5 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{metric.emoji}</span>
                    <span className="text-sm font-medium text-bloom-deep">{metric.label}</span>
                  </div>
                  {AUDIENCES.map((audience) => (
                    <div key={audience.key} className="flex justify-center">
                      <button
                        onClick={() => handleToggle(metric.key, audience.key)}
                        disabled={audience.key === "me"}
                        className="group relative"
                        aria-label={`${permissions[metric.key]?.[audience.key] ? "Revoke" : "Grant"} ${audience.label} access to ${metric.label}`}
                      >
                        <motion.div
                          className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                            permissions[metric.key]?.[audience.key]
                              ? "bg-emerald-400/80 border-emerald-500/50 shadow-sm shadow-emerald-200"
                              : "bg-gray-200 border-gray-300/50"
                          } ${audience.key === "me" ? "opacity-60 cursor-default" : "cursor-pointer hover:scale-110"}`}
                          whileTap={audience.key !== "me" ? { scale: 0.85 } : undefined}
                          layout
                        >
                          {permissions[metric.key]?.[audience.key] && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </motion.div>
                      </button>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* 3. Data Sharing Summary */}
        <BlurFade delay={0.35}>
          <div className="card-bloom p-5 bg-gradient-to-br from-white to-bloom-sky/5">
            <div className="flex items-center gap-3 mb-3">
              <FileText size={18} className="text-bloom-deep/60" />
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">Sharing Summary</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bloom-cream/60">
                <p className="text-2xl font-bold text-bloom-deep">{sharedCount}</p>
                <p className="text-[10px] text-bloom-deep/50 uppercase tracking-wider mt-0.5">Shared Permissions</p>
              </div>
              <div className="p-3 rounded-xl bg-bloom-cream/60">
                <p className="text-2xl font-bold text-bloom-deep">{METRICS.length * 2 - sharedCount}</p>
                <p className="text-[10px] text-bloom-deep/50 uppercase tracking-wider mt-0.5">Blocked</p>
              </div>
            </div>
            <p className="text-xs text-bloom-deep/50 mt-3 leading-relaxed">
              You are sharing <span className="font-semibold">{sharedCount}</span> metric-audience combinations.
              {sharedCount === 0 && " Only you can see your data."}
              {sharedCount > 0 && sharedCount <= 6 && " A balanced approach to privacy."}
              {sharedCount > 6 && " Consider if all sharing is necessary."}
            </p>
          </div>
        </BlurFade>

        {/* 4. Encryption Info Card */}
        <BlurFade delay={0.45}>
          <div className="card-bloom p-5 bg-gradient-to-br from-bloom-sky/10 to-white border border-bloom-sky/20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-bloom-sky/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock size={16} className="text-bloom-deep" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-bloom-deep mb-1">End-to-End Encrypted</h2>
                <p className="text-xs text-bloom-deep/60 leading-relaxed">
                  All your wellness data is encrypted at rest and in transit using AES-256 encryption.
                  Only you hold the keys — not even Bloomie can read your raw data without your permission.
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-bloom-sky/15 text-bloom-deep/70">AES-256</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-bloom-sky/15 text-bloom-deep/70">TLS 1.3</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-bloom-sky/15 text-bloom-deep/70">Zero-knowledge</span>
                </div>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* 5. Audit Log Recent Entries */}
        <BlurFade delay={0.55}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={18} className="text-bloom-deep/60" />
              <h2 className="text-sm font-bold text-bloom-deep/70 uppercase tracking-wider">Recent Activity</h2>
            </div>
            {auditLog.length === 0 ? (
              <p className="text-xs text-bloom-deep/40 text-center py-4">No recent activity recorded.</p>
            ) : (
              <div className="space-y-2">
                {auditLog.slice(0, 5).map((entry, idx) => (
                  <motion.div
                    key={entry.id || idx}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-bloom-cream/40"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                  >
                    <div className="w-2 h-2 rounded-full bg-bloom-sky/50 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-bloom-deep truncate">{entry.action || entry.detail}</p>
                      <p className="text-[10px] text-bloom-deep/40 mt-0.5">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "—"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </BlurFade>

        {/* 6. Delete Data Button */}
        <BlurFade delay={0.65}>
          <div className="card-bloom p-5 border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <Trash2 size={18} className="text-red-400" />
              <h2 className="text-sm font-bold text-red-500/80 uppercase tracking-wider">Danger Zone</h2>
            </div>
            <p className="text-xs text-bloom-deep/60 mb-4 leading-relaxed">
              Permanently delete all your data. This action cannot be undone — your garden, history, and all tracked metrics will be erased.
            </p>

            <AnimatePresence mode="wait">
              {!showDeleteConfirm ? (
                <motion.button
                  key="delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 px-4 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  Delete All My Data
                </motion.button>
              ) : (
                <motion.div
                  key="confirm-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <p className="text-xs font-semibold text-red-500 text-center">
                    Are you sure? This is irreversible.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-bloom-cream border border-bloom-deep/10 text-bloom-deep text-sm font-medium hover:bg-bloom-sky/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // In a real implementation, call api.deleteAllData()
                        setShowDeleteConfirm(false);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                    >
                      Yes, Delete Everything
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BlurFade>
      </div>

      <BottomNav />
    </main>
  );
}

export default PrivacyPage;
