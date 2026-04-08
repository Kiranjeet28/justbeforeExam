"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type LoaderVariant = "spinner" | "skeleton" | "progress" | "pulse" | "dots" | "bars";
export type LoaderSize = "sm" | "md" | "lg" | "xl";
export type LoaderColor = "violet" | "blue" | "emerald" | "red" | "amber";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: LoaderColor;
  text?: string;
  progress?: number;
  isLoading?: boolean;
  fullscreen?: boolean;
  overlay?: boolean;
}

const sizeClasses: Record<LoaderSize, Record<string, string>> = {
  sm: {
    spinner: "w-4 h-4",
    dots: "gap-1",
    bars: "gap-1",
    text: "text-xs",
  },
  md: {
    spinner: "w-8 h-8",
    dots: "gap-2",
    bars: "gap-1.5",
    text: "text-sm",
  },
  lg: {
    spinner: "w-12 h-12",
    dots: "gap-3",
    bars: "gap-2",
    text: "text-base",
  },
  xl: {
    spinner: "w-16 h-16",
    dots: "gap-4",
    bars: "gap-2.5",
    text: "text-lg",
  },
};

const colorClasses: Record<LoaderColor, { text: string; bg: string; gradient: string }> = {
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500 dark:bg-violet-400",
    gradient: "from-violet-500 to-violet-600 dark:from-violet-400 dark:to-violet-500",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500 dark:bg-blue-400",
    gradient: "from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500 dark:bg-emerald-400",
    gradient: "from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500",
  },
  red: {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500 dark:bg-red-400",
    gradient: "from-red-500 to-red-600 dark:from-red-400 dark:to-red-500",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500 dark:bg-amber-400",
    gradient: "from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500",
  },
};

const Loader = forwardRef<HTMLDivElement, LoaderProps>(
  (
    {
      variant = "spinner",
      size = "md",
      color = "violet",
      text,
      progress,
      isLoading = true,
      fullscreen = false,
      overlay = false,
      className,
      ...props
    },
    ref
  ) => {
    if (!isLoading && !fullscreen) return null;

    const spinnerSize = sizeClasses[size].spinner;
    const colorConfig = colorClasses[color];

    const containerClasses = cn(
      fullscreen &&
        "fixed inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm",
      overlay &&
        "absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-slate-950/30 backdrop-blur-sm rounded-lg",
      !fullscreen && !overlay && "flex flex-col items-center justify-center gap-4",
      className
    );

    const renderSpinner = () => (
      <motion.div
        className={cn(spinnerSize, "relative")}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        role="status"
        aria-label="Loading"
      >
        <svg
          className="w-full h-full text-slate-200 dark:text-slate-800"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg
          className={cn("absolute inset-0 w-full h-full", colorConfig.text)}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="60"
            strokeDashoffset="60"
            strokeLinecap="round"
            style={{
              animation: "spin 2s linear infinite",
            }}
          />
        </svg>
      </motion.div>
    );

    const renderDots = () => (
      <div className={cn("flex items-center justify-center", sizeClasses[size].dots)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-full",
              size === "sm" && "w-2 h-2",
              size === "md" && "w-3 h-3",
              size === "lg" && "w-4 h-4",
              size === "xl" && "w-5 h-5",
              colorConfig.bg
            )}
            animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );

    const renderBars = () => (
      <div className={cn("flex items-end justify-center", sizeClasses[size].bars)}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-sm",
              size === "sm" && "w-1 h-4",
              size === "md" && "w-1.5 h-6",
              size === "lg" && "w-2 h-10",
              size === "xl" && "w-3 h-14",
              colorConfig.bg
            )}
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );

    const renderSkeleton = () => (
      <div className="w-full max-w-md space-y-4" role="status">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    );

    const renderProgress = () => (
      <div className="w-full max-w-md space-y-2" role="status">
        <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", colorConfig.gradient)}
            initial={{ width: "0%" }}
            animate={{ width: `${progress || 0}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {progress !== undefined && (
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium">
            {Math.round(progress)}% complete
          </p>
        )}
      </div>
    );

    const renderPulse = () => (
      <motion.div
        className={cn(
          spinnerSize,
          "rounded-lg",
          `bg-gradient-to-br ${colorConfig.gradient}`
        )}
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        role="status"
        aria-label="Loading"
      />
    );

    const loaderContent: Record<LoaderVariant, React.ReactNode> = {
      spinner: renderSpinner(),
      skeleton: renderSkeleton(),
      progress: renderProgress(),
      pulse: renderPulse(),
      dots: renderDots(),
      bars: renderBars(),
    };

    return (
      <div ref={ref} className={containerClasses} {...props}>
        <div className="flex flex-col items-center gap-4">
          {loaderContent[variant]}
          {text && (
            <p
              className={cn(
                "font-medium text-slate-700 dark:text-slate-300 text-center",
                sizeClasses[size].text
              )}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Loader.displayName = "Loader";

export default Loader;
