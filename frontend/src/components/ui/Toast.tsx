"use client";

import React, { forwardRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: ToastAction;
  icon?: React.ReactNode;
  dismissible?: boolean;
}

export interface ToastContextType {
  toasts: (ToastProps & { id: string })[];
  addToast: (toast: Omit<ToastProps, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const typeConfig: Record<
  ToastType,
  {
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    bgColor:
      "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800",
    borderColor: "border-l-4 border-l-emerald-500",
    textColor: "text-emerald-900 dark:text-emerald-100",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    bgColor:
      "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800",
    borderColor: "border-l-4 border-l-red-500",
    textColor: "text-red-900 dark:text-red-100",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor:
      "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800",
    borderColor: "border-l-4 border-l-amber-500",
    textColor: "text-amber-900 dark:text-amber-100",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bgColor:
      "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800",
    borderColor: "border-l-4 border-l-blue-500",
    textColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      type = "info",
      title,
      message,
      duration = 5000,
      onClose,
      action,
      icon,
      dismissible = true,
      className,
      ...props
    },
    ref
  ) => {
    const config = typeConfig[type];

    useEffect(() => {
      if (duration === 0 || !duration) return;

      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
      <motion.div
        ref={ref}
        id={id}
        layout
        initial={{ opacity: 0, x: 100, y: 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "w-full max-w-md",
          config.bgColor,
          config.borderColor,
          "rounded-lg p-4 shadow-lg dark:shadow-2xl backdrop-blur-sm",
          "pointer-events-auto",
          className
        )}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        {...props}
      >
        <div className="flex gap-3 items-start">
          {/* Icon */}
          <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
            {icon || config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3
                className={cn(
                  "font-semibold text-sm",
                  config.textColor
                )}
              >
                {title}
              </h3>
            )}
            {message && (
              <p
                className={cn(
                  "text-sm mt-1",
                  config.textColor,
                  "opacity-90"
                )}
              >
                {message}
              </p>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  "text-xs font-semibold mt-2",
                  config.iconColor,
                  "hover:opacity-75 transition-opacity",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500",
                  "dark:focus-visible:ring-offset-slate-950 px-2 py-1 rounded"
                )}
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          {dismissible && (
            <button
              onClick={onClose}
              className={cn(
                "flex-shrink-0 inline-flex items-center justify-center",
                "p-1 rounded hover:bg-black/10 dark:hover:bg-white/10",
                config.textColor,
                "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                "dark:focus-visible:ring-offset-slate-950"
              )}
              aria-label={`Close ${type} notification`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar for auto-dismiss */}
        {duration && duration > 0 && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        )}
      </motion.div>
    );
  }
);

Toast.displayName = "Toast";

// Toast Container Component
export interface ToastContainerProps {
  position?: ToastPosition;
  toasts: (ToastProps & { id: string })[];
  onRemove: (id: string) => void;
}

const positionClasses: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = "top-right",
  toasts,
  onRemove,
}) => {
  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-3 pointer-events-none",
        positionClasses[position],
        position.includes("center") && "w-full max-w-md px-4"
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onClose={() => onRemove(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

ToastContainer.displayName = "ToastContainer";

// Toast Context
export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = "top-right",
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>(
    []
  );

  const addToast = React.useCallback(
    (toast: Omit<ToastProps, "id">): string => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => {
        const newToasts = [...prev, { ...toast, id }];
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }
        return newToasts;
      });
      return id;
    },
    [maxToasts]
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearToasts,
      }}
    >
      {children}
      <ToastContainer
        position={position}
        toasts={toasts}
        onRemove={removeToast}
      />
    </ToastContext.Provider>
  );
};

ToastProvider.displayName = "ToastProvider";

// Hook to use toast
export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default Toast;
