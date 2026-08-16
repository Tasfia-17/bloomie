"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Phone, MessageCircle, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import { BloomieChat } from "@/components/shared/bloomie-chat";
import { BlurFade } from "@/components/shared/blur-fade";
import { api } from "@/lib/api";
import { getBloomieUser } from "@/lib/auth";

type TimelineDay = {
  date: string;
  hr: { avg: number; status: string };
  sleep: { hours: number; status: string };
  steps: { count: number; status: string };
};

type ClinicalAlert = {
  id: string;
  severity: "red" | "yellow" | "green";
  title: string;
  message: string;
  timestamp: string;
  metric?: string;
};

type Baseline = {
  metric: string;
  value: string;
  range: string;
};

function ClinicalPage() {
  const user = getBloomieUser();
  const userName = user?.name || "Patient";

  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [alertLevel, setAlertLevel] = useState<"green" | "yellow" | "red">("green");
  const [baselines, setBaselines] = useState<Baseline[]>([]);

  useEffect(() => {
    const fetchClinicalData = async () => {
      try {
        const [timelineData, alertsData] = await Promise.all([
          api.getPatientTimeline("demo", 7),
          api.getClinicalAlerts("demo"),
        ]);

        if (timelineData) {
          setTimeline(
            (timelineData as { days?: TimelineDay[] }).days || generateMockTimeline()
          );
          setAiSummary(
            (timelineData as { ai_summary?: string }).ai_summary ||
              "Patient shows stable vitals over the past week. Sleep duration slightly below baseline on 2 days. Heart rate variability within normal range. No critical patterns detected."
          );
          setBaselines(
            (timelineData as { baselines?: Baseline[] }).baselines || getDefaultBaselines()
          );
        }

        if (alertsData) {
          const fetchedAlerts = (alertsData as { alerts?: ClinicalAlert[] }).alerts || [];
          setAlerts(fetchedAlerts.length > 0 ? fetchedAlerts : getDefaultAlerts());
          const level = (alertsData as { overall_level?: "green" | "yellow" | "red" }).overall_level || "green";
          setAlertLevel(level);
        }
      } catch {
        setTimeline(generateMockTimeline());
        setAlerts(getDefaultAlerts());
        setAiSummary(
          "Patient shows stable vitals over the past week. Sleep duration slightly below baseline on 2 days. Heart rate variability within normal range. No critical patterns detected."
        );
        setBaselines(getDefaultBaselines());
      }
    };
    fetchClinicalData();
  }, []);

  return (
    <main className="min-h-screen bg-bloom-cream pb-24">
      {/* Patient Header */}
      <div className="bg-white border-b border-bloom-deep/10 px-6 pt-12 pb-5">
        <BlurFade delay={0.1}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-bloom-deep/50 uppercase tracking-wider font-medium">Patient Overview</p>
              <h1 className="font-display text-xl font-bold text-bloom-deep mt-0.5">{userName}</h1>
            </div>
            <AlertBadge level={alertLevel} />
          </div>
        </BlurFade>
      </div>

      <div className="px-5 py-6 space-y-5 max-w-lg mx-auto">
        {/* 7-Day Metrics Timeline */}
        <BlurFade delay={0.2}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-bloom-deep/60" />
              <h2 className="text-xs font-bold text-bloom-deep/70 uppercase tracking-wider">7-Day Metrics</h2>
            </div>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-bloom-deep/10">
                    <th className="text-left py-2 px-2 font-semibold text-bloom-deep/60">Date</th>
                    <th className="text-center py-2 px-2 font-semibold text-bloom-deep/60">HR (bpm)</th>
                    <th className="text-center py-2 px-2 font-semibold text-bloom-deep/60">Sleep (h)</th>
                    <th className="text-center py-2 px-2 font-semibold text-bloom-deep/60">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((day) => (
                    <tr key={day.date} className="border-b border-bloom-deep/5 last:border-0">
                      <td className="py-2 px-2 font-medium text-bloom-deep/80">{formatDate(day.date)}</td>
                      <td className="py-2 px-2 text-center">
                        <MetricCell value={`${day.hr.avg}`} status={day.hr.status} />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <MetricCell value={`${day.sleep.hours}`} status={day.sleep.status} />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <MetricCell value={`${day.steps.count.toLocaleString()}`} status={day.steps.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </BlurFade>

        {/* AI Summary */}
        <BlurFade delay={0.3}>
          <div className="card-bloom p-5 bg-gradient-to-br from-white to-bloom-sky/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-bloom-lavender/20 flex items-center justify-center flex-shrink-0">
                <Activity size={14} className="text-bloom-lavender" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-bloom-deep/70 uppercase tracking-wider mb-2">AI Clinical Summary</h2>
                <p className="text-sm text-bloom-deep/80 leading-relaxed">{aiSummary}</p>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Active Alerts */}
        <BlurFade delay={0.4}>
          <div className="card-bloom p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-bloom-deep/60" />
              <h2 className="text-xs font-bold text-bloom-deep/70 uppercase tracking-wider">Active Alerts</h2>
              <span className="ml-auto text-[10px] font-semibold bg-bloom-deep/5 text-bloom-deep/60 px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-bloom-deep/40 text-center py-4">No active alerts</p>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Baselines Reference */}
        <BlurFade delay={0.5}>
          <div className="card-bloom p-5">
            <h2 className="text-xs font-bold text-bloom-deep/70 uppercase tracking-wider mb-4">Baselines Reference</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-bloom-deep/10">
                  <th className="text-left py-2 font-semibold text-bloom-deep/60">Metric</th>
                  <th className="text-center py-2 font-semibold text-bloom-deep/60">Current</th>
                  <th className="text-right py-2 font-semibold text-bloom-deep/60">Normal Range</th>
                </tr>
              </thead>
              <tbody>
                {baselines.map((b) => (
                  <tr key={b.metric} className="border-b border-bloom-deep/5 last:border-0">
                    <td className="py-2 font-medium text-bloom-deep/80">{b.metric}</td>
                    <td className="py-2 text-center font-semibold text-bloom-deep">{b.value}</td>
                    <td className="py-2 text-right text-bloom-deep/50">{b.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BlurFade>

        {/* Actions */}
        <BlurFade delay={0.6}>
          <div className="card-bloom p-5">
            <h2 className="text-xs font-bold text-bloom-deep/70 uppercase tracking-wider mb-4">Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bloom-sage/10 hover:bg-bloom-sage/20 transition-colors border border-bloom-sage/20">
                <Phone size={16} className="text-bloom-forest" />
                <span className="text-sm font-semibold text-bloom-forest">Call</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bloom-lavender/10 hover:bg-bloom-lavender/20 transition-colors border border-bloom-lavender/20">
                <MessageCircle size={16} className="text-bloom-lavender" />
                <span className="text-sm font-semibold text-bloom-deep/80">Message</span>
              </button>
            </div>
          </div>
        </BlurFade>
      </div>

      <BloomieChat />
      <BottomNav />
    </main>
  );
}

// --- Sub-components ---

function AlertBadge({ level }: { level: "green" | "yellow" | "red" }) {
  const config = {
    green: { bg: "status-green", text: "text-green-800", label: "Stable" },
    yellow: { bg: "status-yellow", text: "text-yellow-800", label: "Watch" },
    red: { bg: "status-red", text: "text-red-800", label: "Alert" },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      {level === "red" && <AlertTriangle size={12} />}
      {c.label}
    </span>
  );
}

function MetricCell({ value, status }: { value: string; status: string }) {
  const statusStyles: Record<string, string> = {
    normal: "text-bloom-deep/80",
    green: "text-bloom-deep/80",
    low: "status-yellow text-yellow-800 px-1.5 py-0.5 rounded",
    yellow: "status-yellow text-yellow-800 px-1.5 py-0.5 rounded",
    high: "status-red text-red-800 px-1.5 py-0.5 rounded",
    red: "status-red text-red-800 px-1.5 py-0.5 rounded",
  };
  const icon = status === "high" || status === "red" ? (
    <TrendingUp size={10} className="inline ml-0.5" />
  ) : status === "low" || status === "yellow" ? (
    <TrendingDown size={10} className="inline ml-0.5" />
  ) : null;

  return (
    <span className={`inline-flex items-center font-semibold ${statusStyles[status] || statusStyles.normal}`}>
      {value}{icon}
    </span>
  );
}

function AlertRow({ alert }: { alert: ClinicalAlert }) {
  const severityDot: Record<string, string> = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-bloom-cream/50">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot[alert.severity] || severityDot.green}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-bloom-deep">{alert.title}</p>
        <p className="text-xs text-bloom-deep/60 mt-0.5 leading-relaxed">{alert.message}</p>
        <p className="text-[10px] text-bloom-deep/40 mt-1">{alert.timestamp}</p>
      </div>
    </div>
  );
}

// --- Helpers ---

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function generateMockTimeline(): TimelineDay[] {
  const days: TimelineDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split("T")[0],
      hr: { avg: 68 + Math.floor(Math.random() * 12), status: i === 2 ? "high" : "normal" },
      sleep: { hours: parseFloat((6.5 + Math.random() * 2).toFixed(1)), status: i === 4 ? "low" : "normal" },
      steps: { count: 4000 + Math.floor(Math.random() * 6000), status: i === 5 ? "low" : "normal" },
    });
  }
  return days;
}

function getDefaultAlerts(): ClinicalAlert[] {
  return [
    {
      id: "1",
      severity: "yellow",
      title: "Sleep below baseline",
      message: "2 nights in the past week fell below 6h. Trend is declining.",
      timestamp: "2 hours ago",
      metric: "sleep",
    },
    {
      id: "2",
      severity: "green",
      title: "Heart rate stable",
      message: "Resting HR remains within normal range (62-78 bpm).",
      timestamp: "Today",
      metric: "heart_rate",
    },
  ];
}

function getDefaultBaselines(): Baseline[] {
  return [
    { metric: "Resting HR", value: "72 bpm", range: "60–100 bpm" },
    { metric: "Sleep", value: "7.2 h", range: "7–9 h" },
    { metric: "Steps", value: "7,400", range: "6,000–10,000" },
    { metric: "HRV", value: "42 ms", range: "30–60 ms" },
  ];
}

export default ClinicalPage;
