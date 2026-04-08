"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type BadgeVariant = "solid" | "outline" | "ghost" | "dot";
export type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";
export type BadgeSize = "xs" | "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  icon?: React.ReactNode;
  onRemove?: () => void;
  removable?: boolean;
  pill?: boolean;
  animated?: boolean;
  children: React.ReactNode;
}

const colorVariants: Record<BadgeColor, Record<BadgeVariant, string>> = {
  primary: {
    solid:
      "bg-gradient-to-r from-violet-500 to-blue-500 text-white dark:from-violet-600 dark:to-blue-600",
    outline:
      "border border-violet-500 dark:border-violet-400 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30",
    ghost:
      "text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30",
    dot: "bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100",
  },
  secondary: {
    solid:
      "bg-slate-600 text-white dark:bg-slate-500",
    outline:
      "border border-slate-400 dark:border-slate-500 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30",
    ghost:
      "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50",
    dot: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
  },
  success: {
    solid:
      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white dark:from-emerald-600 dark:to-teal-600",
    outline:
      "border border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30",
    ghost:
      "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
    dot: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100",
  },
  warning: {
    solid:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white dark:from-amber-600 dark:to-orange-600",
    outline:
      "border border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30",
    ghost:
      "text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30",
    dot: "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100",
  },
  danger: {
    solid:
      "bg-gradient-to-r from-red-500 to-rose-500 text-white dark:from-red-600 dark:to-rose-600",
    outline:
      "border border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30",
    ghost:
      "text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30",
    dot: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100",
  },
  info: {
    solid:
      "bg-gradient-to-r from-blue-500 to-cyan-500 text-white dark:from-blue-600 dark:to-cyan-600",
    outline:
      "border border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30",
    ghost:
      "text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30",
    dot: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100",
  },
  neutral: {
    solid:
      "bg-slate-400 text-white dark:bg-slate-600",
    outline:
      "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/30",
    ghost:
      "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50",
    dot: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-xs",
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "solid",
      color = "primary",
      size = "md",
      icon,
      onRemove,
      removable = false,
      pill = false,
      animated = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const colorClass = colorVariants[color][variant];
    const sizeClass = sizeClasses[size];

    const containerVariants = {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0, opacity: 0 },
    };

    const content = (
      <div className="inline-flex items-center gap-1.5">
        {variant === "dot" && (
          <span
            className={cn(
              "inline-block rounded-full",
              size === "xs" && "w-1.5 h-1.5",
              size === "sm" && "w-2 h-2",
              size === "md" && "w-2.5 h-2.5",
              size === "lg" && "w-3 h-3",
              color === "primary" && "bg-violet-600 dark:bg-violet-400",
              color === "secondary" && "bg-slate-600 dark:bg-slate-400",
              color === "success" && "bg-emerald-600 dark:bg-emerald-400",
              color === "warning" && "bg-amber-600 dark:bg-amber-400",
              color === "danger" && "bg-red-600 dark:bg-red-400",
              color === "info" && "bg-blue-600 dark:bg-blue-400",
              color === "neutral" && "bg-slate-500 dark:bg-slate-500"
            )}
            aria-hidden="true"
          />
        )}
        {icon && <span className="inline-flex">{icon}</span>}
        <span className="font-medium">{children}</span>
        {removable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className={cn(
              "inline-flex items-center justify-center rounded transition-colors",
              "ml-1 p-0.5 hover:opacity-75 focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1"
            )}
            aria-label={`Remove ${children}`}
            tabIndex={0}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );

    return (
      <motion.span
        ref={ref}
        variants={animated ? containerVariants : undefined}
        initial={animated ? "initial" : undefined}
        animate={animated ? "animate" : undefined}
        exit={animated ? "exit" : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "inline-flex items-center whitespace-nowrap font-semibold",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500",
          "dark:focus-visible:ring-offset-slate-950",
          colorClass,
          sizeClass,
          pill ? "rounded-full" : "rounded-md",
          className
        )}
        {...props}
      >
        {content}
      </motion.span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
