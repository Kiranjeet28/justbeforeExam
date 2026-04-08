"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

export type InputType = "text" | "email" | "password" | "number" | "search" | "tel" | "url";
export type InputState = "default" | "error" | "success" | "warning";
export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  state?: InputState;
  size?: InputSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  isLoading?: boolean;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
}

const stateStyles: Record<InputState, string> = {
  default:
    "border-slate-300 dark:border-slate-600 focus:border-violet-500 focus:ring-violet-500 dark:focus:border-violet-400 dark:focus:ring-violet-400",
  error:
    "border-red-500 dark:border-red-400 focus:border-red-600 focus:ring-red-600 dark:focus:border-red-300 dark:focus:ring-red-300",
  success:
    "border-emerald-500 dark:border-emerald-400 focus:border-emerald-600 focus:ring-emerald-600 dark:focus:border-emerald-300 dark:focus:ring-emerald-300",
  warning:
    "border-amber-500 dark:border-amber-400 focus:border-amber-600 focus:ring-amber-600 dark:focus:border-amber-300 dark:focus:ring-amber-300",
};

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      helperText,
      errorMessage,
      successMessage,
      state = "default",
      size = "md",
      icon,
      iconPosition = "left",
      fullWidth = false,
      isLoading = false,
      showPasswordToggle = false,
      disabled = false,
      type = "text",
      containerClassName,
      labelClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [inputState, setInputState] = React.useState<InputState>(state);

    React.useEffect(() => {
      setInputState(state);
    }, [state]);

    const inputType = showPassword && type === "password" ? "text" : type;
    const message = errorMessage || successMessage || helperText;
    const displayState = errorMessage ? "error" : successMessage ? "success" : state;

    return (
      <div className={cn("flex flex-col gap-2", fullWidth && "w-full", containerClassName)}>
        {label && (
          <motion.label
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium text-slate-700 dark:text-slate-300",
              disabled && "opacity-50",
              labelClassName
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </motion.label>
        )}

        <motion.div
          className="relative w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Left Icon */}
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              {icon}
            </div>
          )}

          {/* Input Element */}
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
              "border-2 rounded-lg transition-all duration-200",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "dark:focus-visible:ring-offset-slate-900",
              stateStyles[displayState],
              sizeStyles[size],
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              showPasswordToggle && type === "password" && "pr-10",
              isLoading && "opacity-75 cursor-wait",
              disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900",
              className
            )}
            aria-invalid={displayState === "error"}
            aria-describedby={message ? `${props.id}-message` : undefined}
            {...props}
          />

          {/* Right Icon / Password Toggle / Loading State */}
          {(icon && iconPosition === "right") ||
          (showPasswordToggle && type === "password") ||
          isLoading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-auto">
              {isLoading ? (
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-violet-500 dark:border-slate-600 dark:border-t-violet-400"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  aria-label="Loading"
                />
              ) : showPasswordToggle && type === "password" ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  )}
                </button>
              ) : (
                <div className="text-slate-500 dark:text-slate-400 pointer-events-none">
                  {icon}
                </div>
              )}
            </div>
          ) : null}

          {/* State Icons */}
          {!isLoading && displayState !== "default" && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {displayState === "error" && (
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
              )}
              {displayState === "success" && (
                <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              )}
            </div>
          )}
        </motion.div>

        {/* Helper/Error Message */}
        {message && (
          <motion.p
            id={`${props.id}-message`}
            className={cn(
              "text-sm font-medium",
              errorMessage && "text-red-600 dark:text-red-400",
              successMessage && "text-emerald-600 dark:text-emerald-400",
              !errorMessage && !successMessage && "text-slate-500 dark:text-slate-400"
            )}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            role={errorMessage ? "alert" : undefined}
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
