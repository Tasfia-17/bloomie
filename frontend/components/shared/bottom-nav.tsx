"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/garden", icon: "🌳", label: "Garden" },
  { href: "/today", icon: "☀️", label: "Today" },
  { href: "/log", icon: "➕", label: "Log", isAction: true },
  { href: "/insights", icon: "📊", label: "Insights" },
  { href: "/nest", icon: "🪺", label: "Nest" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 nav-bloom py-2 px-4 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isAction = item.isAction;

          if (isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-bloom-sage to-bloom-forest flex items-center justify-center text-xl shadow-bloom text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {item.icon}
                </motion.div>
                <span className="text-[10px] font-semibold text-bloom-forest">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-bloom-sage/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className={`text-xl relative z-10 ${isActive ? "scale-110" : ""} transition-transform`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-semibold relative z-10 ${isActive ? "text-bloom-forest" : "text-bloom-deep/50"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
