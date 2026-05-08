"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const WorkspaceComplete = dynamic(
  () => import("@/components/WorkspaceComplete"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          <p className="text-slate-300">Loading workspace...</p>
        </div>
      </div>
    ),
  }
);

// Enhanced Background Pattern Component with Smooth Animated Effects
const BackgroundPattern = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Top Right Animated Gradient Orb */}
    <motion.div
      className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] bg-gradient-to-br from-violet-600/8 to-violet-500/4 rounded-full blur-3xl"
      animate={{
        y: [0, 40, 0],
        x: [0, 25, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1],
      }}
    />

    {/* Bottom Left Animated Gradient Orb */}
    <motion.div
      className="absolute bottom-0 left-0 w-72 h-72 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] bg-gradient-to-tl from-indigo-600/8 to-indigo-500/4 rounded-full blur-3xl"
      animate={{
        y: [0, -40, 0],
        x: [0, -25, 0],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1],
      }}
    />

    {/* Center Pulsing Gradient Orb */}
    <motion.div
      className="absolute top-1/3 left-1/2 w-80 h-80 sm:w-96 sm:h-96 md:w-[520px] md:h-[520px] bg-gradient-to-b from-blue-600/6 via-violet-600/4 to-indigo-600/6 rounded-full blur-3xl -translate-x-1/2"
      animate={{
        scale: [0.95, 1.05, 0.95],
        opacity: [0.25, 0.4, 0.25],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1],
      }}
    />

    {/* Subtle Grid Pattern Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:50px_50px] opacity-50" />
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<"notes">("notes");

  // Enhanced animation variants with proper Framer Motion easing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, type: "tween", ease: [0.4, 0, 0.2, 1] },
    },
  } as const;

  const tabContainerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        type: "tween",
        ease: [0.4, 0, 0.2, 1],
        delay: 0.25,
      },
    },
  } as const;

  const dividerVariants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.8, type: "tween", ease: [0.4, 0, 0.2, 1] },
    },
  } as const;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 overflow-hidden">
      <BackgroundPattern />

      {/* Main Content Container */}
      <div className="relative z-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-12 lg:gap-14 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          {/* ========== HEADER SECTION ========== */}
          <motion.header
            className="space-y-10 sm:space-y-12 lg:space-y-14"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo and Branding Row */}
            <motion.div
              variants={itemVariants as any}
              className="flex items-center gap-3 sm:gap-4 group"
            >
              <div className="relative h-7 sm:h-9 md:h-11 flex items-center transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo/Logo.png"
                  alt="Just Before Exam Logo"
                  width={172}
                  height={118}
                  className="h-full w-auto"
                  priority
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <motion.p
                  className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  Just Before Exam
                </motion.p>
                <p className="text-xs sm:text-xs text-slate-400 font-medium tracking-widest">
                  STUDY SMARTER
                </p>
              </div>
            </motion.div>

            {/* Hero Section - Main Heading and Description */}
            <motion.div
              variants={itemVariants as any}
              className="space-y-6 sm:space-y-8 lg:space-y-10"
            >
              {/* Animated Gradient Accent Background */}
              <div className="relative">
                <motion.div
                  className="absolute -inset-4 sm:-inset-6 lg:-inset-8 bg-gradient-to-r from-violet-600/12 via-indigo-600/10 to-violet-600/8 rounded-3xl sm:rounded-4xl blur-3xl opacity-0"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: [0.42, 0, 0.58, 1],
                  }}
                />
                <div className="relative">
                  <h1 className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight sm:leading-tight md:leading-snug lg:leading-snug tracking-tight bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 bg-clip-text text-transparent drop-shadow-lg">
                    You Still Have a Lot of Time
                  </h1>
                </div>
              </div>

              {/* Description Text with Enhanced Contrast */}
              <motion.p
                variants={itemVariants as any}
                className="max-w-3xl text-sm sm:text-base lg:text-lg leading-relaxed font-light text-slate-300 tracking-wide"
              >
                Collect notes, videos, and sources in one unified workspace.
                Generate comprehensive study materials with cutting-edge AI
                technology. Master any subject efficiently and confidently.
              </motion.p>

              {/* Feature Badges with Enhanced Styling */}
              <motion.div
                variants={itemVariants as any}
                className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4"
              >
                {[
                  { icon: "📚", label: "Smart Notes" },
                  { icon: "🎯", label: "AI-Powered" },
                  { icon: "⚡", label: "Lightning Fast" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/25 hover:border-violet-400/50 hover:from-violet-500/20 hover:to-indigo-500/20 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-violet-500/10 backdrop-blur-sm">
                      <span className="text-base sm:text-lg block group-hover:scale-110 transition-transform duration-200">
                        {feature.icon}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">
                        {feature.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.header>

          {/* Top Decorative Divider */}
          <motion.div
            variants={dividerVariants as any}
            initial="hidden"
            animate="visible"
            className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent w-full"
          />

          {/* ========== ENHANCED TAB SWITCHER ========== */}
          <motion.div
            variants={tabContainerVariants as any}
            initial="hidden"
            animate="visible"
            className="flex justify-center w-full"
          >
            <div className="text-center">
              <p className="text-slate-400 text-sm">Ready to study? Start below</p>
            </div>
          </motion.div>

          {/* Bottom Decorative Divider */}
          <motion.div
            variants={dividerVariants as any}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent w-full"
          />

          {/* ========== CONTENT AREA WITH SMOOTH TRANSITIONS ========== */}
          <motion.div className="relative z-10 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{
                  duration: 0.4,
                  type: "tween",
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {activeTab === "notes" && <WorkspaceComplete />}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Bottom Spacing for Better UX */}
          <div className="h-8 sm:h-12 lg:h-16" />
        </div>
      </div>
    </main>
  );
}
