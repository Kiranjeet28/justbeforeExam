"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      size = "md",
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      footer,
      className,
      overlayClassName,
      contentClassName,
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Focus management
    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        const modal = modalRef.current;
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          const handleKeyDown = (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === "Escape") {
              onClose();
            }

            if (e.key === "Tab") {
              if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                  lastElement?.focus();
                  e.preventDefault();
                }
              } else {
                if (document.activeElement === lastElement) {
                  firstElement?.focus();
                  e.preventDefault();
                }
              }
            }
          };

          modal.addEventListener("keydown", handleKeyDown);
          firstElement?.focus();

          return () => {
            modal.removeEventListener("keydown", handleKeyDown);
          };
        }
      } else {
        previousActiveElement.current?.focus();
      }
    }, [isOpen, closeOnEscape, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
          document.body.style.overflow = "";
          document.body.style.paddingRight = "";
        };
      }
    }, [isOpen]);

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              className={cn(
                "fixed inset-0 z-40 bg-black/50 dark:bg-black/70 backdrop-blur-sm",
                overlayClassName
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => closeOnOverlayClick && onClose()}
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              key="modal"
              ref={modalRef || ref}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className={cn(
                  "w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-2xl pointer-events-auto",
                  "border border-slate-200 dark:border-slate-800",
                  "flex flex-col max-h-[90vh] overflow-hidden",
                  sizeClasses[size],
                  className
                )}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby={description ? "modal-description" : undefined}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex-1">
                      {title && (
                        <h2
                          id="modal-title"
                          className="text-xl font-bold text-slate-900 dark:text-slate-50"
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p
                          id="modal-description"
                          className="mt-1 text-sm text-slate-600 dark:text-slate-400"
                        >
                          {description}
                        </p>
                      )}
                    </div>

                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className={cn(
                          "inline-flex items-center justify-center rounded-lg p-2",
                          "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                          "hover:bg-slate-100 dark:hover:bg-slate-800",
                          "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        )}
                        aria-label="Close dialog"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={cn("flex-1 overflow-y-auto p-6 text-slate-700 dark:text-slate-300", contentClassName)}>
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-6">
                    {footer}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

Modal.displayName = "Modal";

export default Modal;
