"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Download,
  Share2,
  Loader,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./ui/Card";

export interface ImprovedNotesViewProps {
  content: string;
  title?: string;
  isLoading?: boolean;
  error?: string | null;
  onClose?: () => void;
  onShare?: () => void;
  className?: string;
}

// Parse reading time from content
const estimateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Format content for rich display
interface ContentBlock {
  type: "heading" | "paragraph" | "code" | "blockquote" | "list" | "image";
  content: string;
  level?: number; // For headings
  items?: string[]; // For lists
  isOrdered?: boolean; // For lists
}

// Parse markdown-like content
const parseContent = (rawContent: string): ContentBlock[] => {
  const blocks: ContentBlock[] = [];
  const lines = rawContent.split("\n");
  let currentList: string[] = [];
  let isOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      continue;
    }

    // Headings
    if (line.startsWith("####")) {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      blocks.push({
        type: "heading",
        content: line.replace(/#+ /, "").trim(),
        level: (line.match(/^#+/) || [""])[0].length,
      });
    } else if (line.startsWith("###")) {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      blocks.push({
        type: "heading",
        content: line.replace(/#+ /, "").trim(),
        level: 3,
      });
    } else if (line.startsWith("##")) {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      blocks.push({
        type: "heading",
        content: line.replace(/#+ /, "").trim(),
        level: 2,
      });
    } else if (line.startsWith("#")) {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      blocks.push({
        type: "heading",
        content: line.replace(/#+ /, "").trim(),
        level: 1,
      });
    }
    // Blockquotes
    else if (line.startsWith(">")) {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      blocks.push({
        type: "blockquote",
        content: line.replace(/^>\s*/, "").trim(),
      });
    }
    // Code blocks
    else if (line.startsWith("```")) {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
      });
    }
    // Unordered lists
    else if (line.match(/^[-*•]\s/)) {
      if (currentList.length === 0) {
        isOrderedList = false;
      }
      currentList.push(line.replace(/^[-*•]\s/, "").trim());
    }
    // Ordered lists
    else if (line.match(/^\d+\.\s/)) {
      if (currentList.length === 0) {
        isOrderedList = true;
      }
      currentList.push(line.replace(/^\d+\.\s/, "").trim());
    }
    // Paragraphs
    else {
      if (currentList.length > 0) {
        blocks.push({
          type: "list",
          content: "",
          items: currentList,
          isOrdered: isOrderedList,
        });
        currentList = [];
      }
      blocks.push({
        type: "paragraph",
        content: line,
      });
    }
  }

  if (currentList.length > 0) {
    blocks.push({
      type: "list",
      content: "",
      items: currentList,
      isOrdered: isOrderedList,
    });
  }

  return blocks;
};

// Content Block Component
const ContentBlockComponent: React.FC<{
  block: ContentBlock;
  index: number;
}> = ({ block, index }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  switch (block.type) {
    case "heading": {
      const level = block.level || 1;
      const headingClasses = {
        1: "text-3xl font-bold",
        2: "text-2xl font-bold",
        3: "text-xl font-bold",
        4: "text-lg font-bold",
      };
      const gradientClasses = {
        1: "from-violet-400 via-indigo-400 to-violet-400",
        2: "from-blue-400 to-indigo-400",
        3: "from-indigo-400 to-violet-400",
        4: "from-slate-400 to-slate-300",
      };

      return (
        <motion.div
          custom={index}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 mb-4 first:mt-0"
        >
          <div
            className={cn(
              "rounded-lg px-4 py-3 bg-gradient-to-r",
              gradientClasses[level as keyof typeof gradientClasses],
              "bg-opacity-10",
            )}
          >
            <h2
              className={cn(
                headingClasses[level as keyof typeof headingClasses],
                "bg-gradient-to-r",
                gradientClasses[level as keyof typeof gradientClasses],
                "bg-clip-text text-transparent",
              )}
            >
              {block.content}
            </h2>
          </div>
        </motion.div>
      );
    }

    case "paragraph":
      return (
        <motion.p
          custom={index}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-slate-300 leading-relaxed mb-3 text-base"
        >
          {block.content}
        </motion.p>
      );

    case "code":
      return (
        <motion.div
          custom={index}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="my-4"
        >
          <div className="rounded-lg bg-slate-950/70 border border-slate-700/50 overflow-hidden">
            <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-700/30 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-slate-400 ml-2">Code</span>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
                {block.content}
              </code>
            </pre>
          </div>
        </motion.div>
      );

    case "blockquote":
      return (
        <motion.div
          custom={index}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="my-4 pl-4 border-l-4 border-violet-400/50 bg-violet-500/10 py-3 px-4 rounded-r-lg"
        >
          <p className="text-slate-300 italic">{block.content}</p>
        </motion.div>
      );

    case "list":
      return (
        <motion.div
          custom={index}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="my-3 ml-2"
        >
          {block.isOrdered ? (
            <ol className="list-decimal list-inside space-y-2">
              {block.items?.map((item, i) => (
                <li key={i} className="text-slate-300 leading-relaxed pl-2">
                  {item}
                </li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc list-inside space-y-2">
              {block.items?.map((item, i) => (
                <li key={i} className="text-slate-300 leading-relaxed pl-2">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      );

    default:
      return null;
  }
};

export const ImprovedNotesView: React.FC<ImprovedNotesViewProps> = ({
  content,
  title = "Notes",
  isLoading = false,
  error = null,
  onClose,
  onShare,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [copied2, setCopied2] = useState(false);

  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  const contentBlocks = useMemo(() => parseContent(content), [content]);

  const handleCopyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${title}-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setCopied2(true);
    setTimeout(() => setCopied2(false), 2000);
  }, [content, title]);

  if (isLoading) {
    return (
      <Card variant="elevated" className="backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader className="w-12 h-12 text-violet-400" />
          </motion.div>
          <p className="text-slate-300 font-medium">Generating your notes...</p>
          <p className="text-sm text-slate-400">This may take a moment</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="elevated" className="border-red-500/50 bg-red-500/10">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-300 mb-2">
              Error Loading Notes
            </h3>
            <p className="text-red-200/80">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card variant="elevated" className="backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <FileText className="w-12 h-12 text-slate-400" />
          <p className="text-slate-300 font-medium">No notes yet</p>
          <p className="text-sm text-slate-400">
            Generate notes from a learning resource to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full space-y-6", className)}
    >
      {/* Header Card */}
      <Card
        variant="elevated"
        gradient="violet-blue"
        className="backdrop-blur-sm"
      >
        <div className="space-y-4">
          {/* Title and Meta */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              {title}
            </h1>
            <div className="flex items-center gap-4 flex-wrap text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-violet-400" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" />
                <span>{contentBlocks.length} sections</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyContent}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                copied
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white",
              )}
            >
              {copied ? (
                <>
                  <CheckCircle size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                copied2
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white",
              )}
            >
              {copied2 ? (
                <>
                  <CheckCircle size={16} />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download</span>
                </>
              )}
            </motion.button>

            {onShare && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShare}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white"
              >
                <Share2 size={16} />
                <span>Share</span>
              </motion.button>
            )}

            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white"
              >
                <span>Close</span>
              </motion.button>
            )}
          </div>
        </div>
      </Card>

      {/* Content Sections */}
      <div className="space-y-1">
        {contentBlocks.map((block, index) => (
          <Card
            key={index}
            variant="default"
            className="hover:shadow-md transition-shadow duration-200 backdrop-blur-sm bg-slate-800/30 border-slate-700/30"
            padding="lg"
          >
            <ContentBlockComponent block={block} index={index} />
          </Card>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 pt-4 pb-8 text-xs text-slate-500"
      >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
        <span>Generated with Just Before Exam</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
      </motion.div>
    </motion.div>
  );
};

export default ImprovedNotesView;
