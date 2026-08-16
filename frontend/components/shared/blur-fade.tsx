"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type BlurFadeProps = {
  children: React.ReactNode;
  delay?: number;
  inView?: boolean;
  className?: string;
};

export function BlurFade({ children, delay = 0, inView = false, className }: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const shouldAnimate = inView ? isInView : true;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: "blur(4px)", y: 12 }}
      animate={shouldAnimate ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
