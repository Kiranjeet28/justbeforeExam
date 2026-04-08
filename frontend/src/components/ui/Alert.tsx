"use client";

import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type AlertVariant = "success" | "error" | "warning" | "info";
export type AlertStyle = "solid" | "soft" | "outlined";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  style?: AlertStyle;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  {
    icon: React.ReactNode;
    solid: string;
    soft: string;
    outlined: string;
    textColor: string;
    iconColor: string;
    borderColor: string;
  }
> = {
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    solid:
      "bg-emerald-500 text-white dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-700",
    soft: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50",
    outlined:
      "bg-transparent text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500 dark:border-emerald-400",
    textColor: "text-emerald-900 dark:text-emerald-200",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500 dark:border-emerald-400",
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    solid:
      "bg-red-500 text-white dark:bg-red-600 border border-red-600 dark:border-red-700",
    soft: "bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200 border border-red-200 dark:border-red-800/50",
    outlined:
      "bg-transparent text-red-900 dark:text-red-200 border-2 border-red-500 dark:border-red-400",
    textColor: "text-red-900 dark:text-red-200",
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-500 dark:border-red-400",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    solid:
      "bg-amber-500 text-white dark:bg-amber-600 border border-amber-600 dark:border-amber-700",
    soft: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50",
    outlined:
      "bg-transparent text-amber-900 dark:text-amber-200 border-2 border-amber-500 dark:border-amber-400",
    textColor: "text-amber-900 dark:text-amber-200",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500 dark:border-amber-400",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    solid:
      "bg-blue-500 text-white dark:bg-blue-600 border border-blue-600 dark:border-blue-700",
    soft: "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50",
    outlined:
      "bg-transparent text-blue-900 dark:text-blue-200 border-2 border-blue-500 dark:border-blue-400",
    textColor: "text-blue-900 dark:text-blue-200",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500 dark:border-blue-400",
  },
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = "info",
      style = "soft",
      title,
      description,
      icon,
      action,
      dismissible = false,
      onDismiss,
      showIcon = true,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const config = variantConfig[variant];
    const styleClass = {
      solid: config.solid,
      soft: config.soft,
      outlined: config.outlined,
    }[style];

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    const alertVariants = {
      hidden: { opacity: 0, y: -10, scale: 0.95 },
      visible: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 0.95 },
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            className={cn(
              "rounded-lg p-4 flex items-start gap-3",
              "border transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500",
              "dark:focus-visible:ring-offset-slate-950",
              styleClass,
              className
            )}
            {...props}
          >
            {/* Icon */}
            {showIcon && (
              <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
                {icon || config.icon}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="font-semibold text-sm leading-tight mb-1">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm opacity-90 leading-relaxed">
                  {description}
                </p>
              )}
              {children && (
                <div className={cn("text-sm leading-relaxed", title && "mt-2")}>
                  {children}
                </div>
              )}
              {action && (
                <motion.button
                  onClick={action.onClick}
                  className={cn(
                    "inline-flex items-center font-semibold text-xs mt-3 px-2 py-1",
                    "rounded transition-all duration-200",
                    "hover:opacity-80 focus:outline-none focus-visible:ring-1",
                    style === "solid"
                      ? "bg-white/20 hover:bg-white/30"
                      : "hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {action.label}
                </motion.button>
              )}
            </div>

            {/* Dismiss Button */}
            {dismissible && (
              <motion.button
                onClick={handleDismiss}
                className={cn(
                  "flex-shrink-0 p-1 rounded transition-all duration-200",
                  "hover:opacity-70 focus:outline-none focus-visible:ring-1",
                  style === "solid"
                    ? "hover:bg-white/20"
                    : "hover:bg-black/10 dark:hover:bg-white/10"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Dismiss ${variant} alert`}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

Alert.displayName = "Alert";

export default Alert;
