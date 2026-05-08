"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link as LinkIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
  Upload,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import Input from "./ui/Input";

export interface SuggestedResource {
  title: string;
  url: string;
  description: string;
  icon: React.ReactNode;
}

export interface InputSectionProps {
  onGenerateNotes?: (url: string) => Promise<void>;
  onGenerateQuiz?: (url: string) => Promise<void>;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  suggestedResources?: SuggestedResource[];
}

const DEFAULT_RESOURCES: SuggestedResource[] = [
  {
    title: "Khan Academy",
    url: "https://www.khanacademy.org",
    description: "Free comprehensive learning platform",
    icon: <BookOpen size={16} />,
  },
  {
    title: "Wikipedia",
    url: "https://www.wikipedia.org",
    description: "Quick reference and deep dives",
    icon: <FileText size={16} />,
  },
  {
    title: "MIT OpenCourseWare",
    url: "https://ocw.mit.edu",
    description: "University-level educational content",
    icon: <Sparkles size={16} />,
  },
];

// URL validation helper
const isValidURL = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Get URL state with visual feedback
const getURLState = (
  url: string,
): "default" | "error" | "success" | "warning" => {
  if (!url) return "default";
  if (url.length > 2048) return "error";
  if (!url.includes(".")) return "warning";
  if (isValidURL(url)) return "success";
  return "warning";
};

export const InputSection: React.FC<InputSectionProps> = ({
  onGenerateNotes,
  onGenerateQuiz,
  onDragEnter,
  onDragLeave,
  onDrop,
  isLoading = false,
  disabled = false,
  className,
  suggestedResources = DEFAULT_RESOURCES,
}) => {
  const [url, setUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"notes" | "quiz" | null>(
    null,
  );

  const urlState = getURLState(url);
  const charCount = url.length;
  const isButtonDisabled = !url || isLoading || localLoading || disabled;
  const isValidForSubmission =
    url && isValidURL(url) && !isLoading && !localLoading;

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);

    // Clear error when user starts typing valid content
    if (isValidURL(value)) {
      setUrlError(null);
    } else if (value && !value.includes(".")) {
      setUrlError("Please enter a valid domain");
    } else if (value.length > 2048) {
      setUrlError("URL is too long (max 2048 characters)");
    } else {
      setUrlError(null);
    }
  };

  // Handle generate notes
  const handleGenerateNotes = useCallback(async () => {
    if (!isValidForSubmission) return;

    setActiveAction("notes");
    setLocalLoading(true);

    try {
      if (onGenerateNotes) {
        await onGenerateNotes(url);
      }
    } catch (error) {
      setUrlError("Failed to generate notes. Please try again.");
      console.error("Generate notes error:", error);
    } finally {
      setLocalLoading(false);
      setActiveAction(null);
    }
  }, [url, isValidForSubmission, onGenerateNotes]);

  // Handle generate quiz
  const handleGenerateQuiz = useCallback(async () => {
    if (!isValidForSubmission) return;

    setActiveAction("quiz");
    setLocalLoading(true);

    try {
      if (onGenerateQuiz) {
        await onGenerateQuiz(url);
      }
    } catch (error) {
      setUrlError("Failed to generate quiz. Please try again.");
      console.error("Generate quiz error:", error);
    } finally {
      setLocalLoading(false);
      setActiveAction(null);
    }
  }, [url, isValidForSubmission, onGenerateQuiz]);

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onDragEnter?.(e);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onDragLeave?.(e);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Get dropped URL or file
    const droppedUrl =
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");
    if (droppedUrl) {
      setUrl(droppedUrl);
    }

    onDrop?.(e);
  };

  // Handle suggested resource click
  const handleSuggestedClick = (resourceUrl: string) => {
    setUrl(resourceUrl);
    setUrlError(null);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "w-full rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50",
          "border border-slate-700/50 backdrop-blur-sm",
          "p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6",
        className,
      )}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20"
          >
            <Zap size={24} className="text-violet-400" />
          </motion.div>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  Paste Your Learning URL
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Transform any webpage into comprehensive notes and quizzes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Input Area with Drag and Drop */}
      <motion.div
        variants={itemVariants}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
            className={cn(
          "relative rounded-xl transition-all duration-300",
          "border-2",
          isDragging
            ? "border-violet-400 bg-violet-500/10"
            : "border-slate-600/50 hover:border-slate-500/50 bg-slate-800/30",
        )}
      >
        {/* Input with Icon */}
        <div className="relative p-3 sm:p-4">
          <Input
            type="url"
            placeholder="https://example.com/learning-resource"
            value={url}
            onChange={handleUrlChange}
            disabled={isLoading || localLoading || disabled}
            state={urlError ? "error" : urlState}
            errorMessage={urlError || undefined}
            size="lg"
            icon={<LinkIcon size={18} />}
            iconPosition="left"
            fullWidth
            containerClassName="w-full"
            className={cn(
              "bg-slate-900/50 border-0 px-4 sm:px-5 text-sm",
              urlState === "success" &&
                "bg-emerald-500/10 text-emerald-100 placeholder:text-emerald-700/50",
            )}
            aria-label="Learning resource URL"
            aria-describedby="url-char-count"
          />

          {/* Character Count Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-3 py-1 rounded-full bg-slate-700/50 text-xs text-slate-300 font-medium"
            id="url-char-count"
          >
            {charCount}/2048
          </motion.div>
        </div>

        {/* Drag and Drop Indicator */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 pointer-events-none"
            >
              <Upload size={24} className="text-violet-300" />
              <span className="text-violet-300 font-semibold">
                Drop URL here
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* URL Validation Indicator */}
        {url && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-3 flex items-center gap-2"
          >
            {urlState === "success" ? (
              <>
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-xs text-emerald-300/80">
                  Valid URL - Ready to process
                </span>
              </>
            ) : urlState === "warning" ? (
              <>
                <AlertCircle size={16} className="text-amber-400" />
                <span className="text-xs text-amber-300/80">
                  Check your URL format
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-xs text-red-300/80">Invalid URL</span>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
      >
        <Button
          onClick={handleGenerateNotes}
          disabled={isButtonDisabled}
          isLoading={activeAction === "notes" && localLoading}
          size="lg"
          fullWidth
          icon={<FileText size={20} />}
          className="group relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={false}
          />
          <span className="relative">Generate Notes</span>
        </Button>

        <Button
          onClick={handleGenerateQuiz}
          disabled={isButtonDisabled}
          isLoading={activeAction === "quiz" && localLoading}
          size="lg"
          fullWidth
          variant="secondary"
          icon={<Sparkles size={20} />}
          className="dark:bg-indigo-900/50 dark:hover:bg-indigo-800/50 dark:text-indigo-100"
        >
          Generate Quiz
        </Button>
      </motion.div>

      {/* Suggested Resources */}
      <motion.div variants={itemVariants} className="space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick Start - Try These Resources
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {suggestedResources.map((resource, index) => (
            <motion.button
              key={index}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              <button
                    onClick={() => handleSuggestedClick(resource.url)}
                    className={cn(
                      "relative group rounded-lg p-2 sm:p-3 text-left",
                      "bg-slate-800/50 hover:bg-slate-700/70",
                      "border border-slate-700/50 hover:border-violet-500/50",
                      "transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                    )}
              aria-label={`Use ${resource.title} as learning source`}
            >
              {/* Gradient background on hover */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
              />

              {/* Content */}
              <div className="relative z-10 space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="p-1 rounded bg-violet-500/20 text-violet-300 text-xs sm:text-sm">
                    {resource.icon}
                  </span>
                  <span className="font-medium text-xs sm:text-sm text-white group-hover:text-violet-300 transition-colors">
                    {resource.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                  {resource.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Empty State Instructions */}
      {!url && (
        <motion.div
          variants={itemVariants}
          className="rounded-lg bg-slate-800/20 border border-slate-700/30 p-3 sm:p-4"
        >
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Upload size={16} className="text-slate-400 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xs sm:text-sm text-slate-400 space-y-1">
              <p className="font-medium text-slate-300">How to use:</p>
              <ul className="space-y-0.5 text-xs ml-2 sm:ml-3">
                <li>• Copy a learning resource URL and paste it above</li>
                <li>• Or drag & drop a URL directly into the input area</li>
                <li>• Try one of the suggested resources to get started</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InputSection;
