"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Copy, Check } from "lucide-react";
import { useState } from "react";
import type React from "react";
import ReactMarkdown from "react-markdown";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

interface ButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  variant?: "secondary" | "primary";
  className?: string;
  children: React.ReactNode;
}

function Card({ className, children }: CardProps) {
  return (
    <section className={`rounded-lg ${className || ""}`}>{children}</section>
  );
}

function Button({ onClick, variant, className, children }: ButtonProps) {
  const baseClasses =
    "inline-flex min-h-10 sm:min-h-11 items-center justify-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-xs sm:text-sm";
  const variantClasses =
    variant === "secondary"
      ? "bg-slate-700 hover:bg-slate-600"
      : "bg-violet-600 hover:bg-violet-500";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className || ""}`}
    >
      {children}
    </button>
  );
}

interface NotesViewPremiumProps {
  content: string;
}

export function NotesViewPremium({ content }: NotesViewPremiumProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["0"]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sections = content
    .split(/(?=^## )/m)
    .filter((section) => section.trim())
    .map((section, index) => ({
      id: index.toString(),
      title: section.split("\n")[0].replace(/^## /, "").trim(),
      content: section.split("\n").slice(1).join("\n").trim(),
    }));

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id)
        ? prev.filter((sectionId) => sectionId !== id)
        : [...prev, id],
    );
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:px-6 md:px-8 lg:p-12"
    >
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
            Study Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 break-words">
            {sections.length} sections • {Math.ceil(content.length / 100)}{" "}
            minutes to read
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-3 sm:space-y-4">
          {sections.map((section, index) => {
            const isExpanded = expandedSections.includes(section.id);

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-violet-500/20 backdrop-blur-xl transition-all duration-300">
                  {/* Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`notes-section-${section.id}`}
                    className="group flex min-h-12 sm:min-h-14 w-full items-center justify-between gap-2 sm:gap-3 rounded-lg p-3 sm:p-4 md:p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    <span className="min-w-0 break-words text-sm sm:text-lg md:text-xl font-bold text-white transition-colors group-hover:text-violet-300">
                      {section.title}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        size={20}
                        className="text-violet-400 sm:w-6 sm:h-6"
                      />
                    </motion.div>
                  </button>

                  {/* Expandable Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        id={`notes-section-${section.id}`}
                        className="mx-3 pb-3 pt-4 sm:mx-4 sm:pb-4 sm:pt-6 md:mx-6 md:pb-6 border-t border-slate-700/50"
                      >
                        {/* Copy Button */}
                        <div className="flex justify-end mb-3 sm:mb-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(section.id, section.content);
                            }}
                            variant="secondary"
                          >
                            {copiedId === section.id ? (
                              <>
                                <Check size={14} className="mr-1" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={14} className="mr-1" /> Copy
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Markdown Content */}
                        <div className="prose prose-invert max-w-none overflow-x-auto text-xs sm:text-sm prose-headings:break-words prose-headings:text-violet-300 prose-headings:text-sm sm:prose-headings:text-base prose-p:break-words prose-p:text-slate-300 prose-p:text-xs sm:prose-p:text-sm prose-strong:text-white prose-code:break-words prose-code:text-cyan-300 prose-code:bg-slate-800/50 prose-code:px-1 sm:prose-code:px-2 prose-code:py-0.5 sm:prose-code:py-1 prose-code:rounded prose-pre:overflow-x-auto prose-pre:text-xs">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
