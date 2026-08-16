"use client";

import type { TimeOfDay } from "@/lib/types";

const TIME_ICONS: Record<TimeOfDay, string> = { day: "☀️", sunset: "🌅", night: "🌙" };
const TIME_CYCLE: TimeOfDay[] = ["day", "sunset", "night"];

type TimeToggleProps = {
  timeOfDay: TimeOfDay;
  onChange: (time: TimeOfDay) => void;
};

export function TimeToggle({ timeOfDay, onChange }: TimeToggleProps) {
  return (
    <button
      onClick={() => onChange(TIME_CYCLE[(TIME_CYCLE.indexOf(timeOfDay) + 1) % 3])}
      className="w-10 h-10 rounded-full glass flex items-center justify-center text-lg hover:bg-white/80 active:scale-90 transition-all"
      title={`Switch to ${TIME_CYCLE[(TIME_CYCLE.indexOf(timeOfDay) + 1) % 3]}`}
    >
      {TIME_ICONS[timeOfDay]}
    </button>
  );
}

export type { TimeOfDay };
