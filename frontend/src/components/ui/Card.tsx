"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "elevated" | "outlined" | "gradient";
export type CardGradient =
  | "violet-blue"
  | "blue-cyan"
  | "emerald-teal"
  | "amber-orange"
  | "rose-red"
  | "none";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  gradient?: CardGradient;
  hoverable?: boolean;
  interactive?: boolean;
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// Gradient presets
const gradientClasses: Record<CardGradient, string> = {
  "violet-blue":
    "bg-gradient-to-br from-violet-500/20 via-blue-500/20 to-blue-600/20 dark:from-violet-500/10 dark:via-blue-500/10 dark:to-blue-600/10",
  "blue-cyan":
    "bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-cyan-600/20 dark:from-blue-500/10 dark:via-cyan-500/10 dark:to-cyan-600/10",
  "emerald-teal":
    "bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-teal-600/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-teal-600/10",
  "amber-orange":
    "bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-orange-600/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-orange-600/10",
  "rose-red":
    "bg-gradient-to-br from-rose-500/20 via-red-500/20 to-red-600/20 dark:from-rose-500/10 dark:via-red-500/10 dark:to-red-600/10",
  none: "",
};

const paddingClasses: Record<string, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
  elevated:
    "bg-white dark:bg-slate-900 shadow-lg dark:shadow-2xl border border-slate-100 dark:border-slate-800/50",
  outlined:
    "bg-transparent border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
  gradient:
    "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700",
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      gradient = "none",
      hoverable = false,
      interactive = false,
      children,
      padding = "md",
      className,
      ...props
    },
    ref
  ) => {
    const hasGradient = gradient !== "none";

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={
          hoverable || interactive ? { y: -4, shadow: "0 20px 25px -5px" } : {}
        }
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "rounded-xl transition-all duration-300",
          variantClasses[variant],
          hasGradient && gradientClasses[gradient],
          paddingClasses[padding],
          hoverable && "hover:shadow-xl dark:hover:shadow-2xl",
          interactive &&
            "cursor-pointer hover:shadow-xl dark:hover:shadow-2xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-violet-500 dark:focus-within:ring-offset-slate-950",
          "overflow-hidden",
          className
        )}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {/* Animated background accent */}
        {(hoverable || interactive) && gradient !== "none" && (
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.1 }}
          />
        )}

        {/* Border gradient effect for gradient variant */}
        {hasGradient && (
          <div
            className={cn(
              "absolute inset-0 rounded-xl pointer-events-none",
              gradientClasses[gradient],
              "opacity-30 dark:opacity-20"
            )}
            aria-hidden="true"
          />
        )}

        {/* Content wrapper */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold text-slate-900 dark:text-slate-100",
      className
    )}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-slate-600 dark:text-slate-400",
      className
    )}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("text-slate-700 dark:text-slate-300", className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 mt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};

export default Card;
