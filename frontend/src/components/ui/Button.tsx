"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  children,
  className,
  icon,
  iconPosition = "left",
  fullWidth = false,
  ...props
}) => {
  // Base styles
  const baseStyles = cn(
    "inline-flex items-center justify-center gap-2",
    "rounded-lg font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-95",
    fullWidth && "w-full"
  );

  // Size variants
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Variant styles
  const variantStyles = {
    primary: cn(
      "bg-gradient-to-r from-violet-500 to-blue-500",
      "text-white shadow-lg hover:shadow-xl",
      "hover:from-violet-600 hover:to-blue-600",
      "dark:from-violet-600 dark:to-blue-600",
      "dark:hover:from-violet-500 dark:hover:to-blue-500",
      "focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400"
    ),
    secondary: cn(
      "bg-slate-200 text-slate-900",
      "hover:bg-slate-300",
      "dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
      "focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
    ),
    ghost: cn(
      "bg-transparent text-slate-700",
      "hover:bg-slate-100",
      "dark:text-slate-300 dark:hover:bg-slate-800",
      "focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
    ),
    danger: cn(
      "bg-red-500 text-white shadow-lg hover:shadow-xl",
      "hover:bg-red-600",
      "dark:bg-red-600 dark:hover:bg-red-500",
      "focus-visible:ring-red-500 dark:focus-visible:ring-red-400"
    ),
  };

  const buttonStyles = cn(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  );

  return (
    <motion.button
      className={buttonStyles}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { y: -2 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            aria-label="Loading"
          />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="flex">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === "right" && <span className="flex">{icon}</span>}
        </>
      )}
    </motion.button>
  );
};
