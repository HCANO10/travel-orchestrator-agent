import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface VividCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverScale?: boolean;
}

export const VividCard: React.FC<VividCardProps> = ({ 
  children, 
  className, 
  delay = 0,
  hoverScale = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hoverScale ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        "glass-card p-6 rounded-2xl bg-white/90 ring-1 ring-slate-200/50",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
