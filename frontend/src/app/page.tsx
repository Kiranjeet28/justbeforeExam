"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { TextGenerateEffect } from "@/components/TextGenerateEffect";
import ReportTab from "@/components/ReportTab";

const Workspace = dynamic(() => import("@/components/Workspace"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
        <p className="text-slate-300">Loading workspace...</p>
      </div>
    </div>
  ),
});

type TabType = "notes" | "report";

// Background pattern component with subtle animated effects
const BackgroundPattern = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Animated gradient orbs */}
    <motion.div
      className="absolute top-0 right-0 w-80 h-80 sm:w-96 sm:h-96 bg-violet-600/8 rounded-full blur-3xl"
      animate={{
        y: [0, 30, 0],
        x: [0, 20, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute bottom-0 left-0 w-80 h-80 sm:w-96 sm:h-96 bg-indigo-600/8 rounded-full blur-3xl"
      animate={{
        y: [0, -30, 0],
        x: [0, -20, 0],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-blue-600/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("notes");
  const [sourcesCount, setSourcesCount] = useState(0);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "notes", label: "Notes", icon: <Pencil size={18} /> },
    { id: "report", label: "Report", icon: <FileText size={18} /> },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const tabContainerVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.3 },
    },
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <BackgroundPattern />

      {/* Content Container */}
      <div className="relative z-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 sm:gap-12 lg:gap-16 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          {/* Enhanced Header Section */}
          <motion.header
            className="space-y-7 sm:space-y-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo and Branding Row */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 sm:gap-4"
            >
              <div className="relative h-8 sm:h-10 md:h-12 flex items-center">
                <Image
                  src="/logo/Logo.png"
                  alt="Just Before Exam Logo"
                  width={172}
                  height={118}
                  className="h-full w-auto"
                  priority
                />
              </div>
              <div className="flex flex-col gap-1">
                <motion.p
                  className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.02 }}
                >
                  Just Before Exam
                </motion.p>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  Study Smarter, Not Harder
                </p>
              </div>
            </motion.div>

            {/* Hero Section - Main Heading and Description */}
            <motion.div
              variants={itemVariants}
              className="space-y-5 sm:space-y-7"
            >
              {/* Gradient background accent */}
              <div className="relative">
                <motion.div
                  className="absolute -inset-3 bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-violet-600/10 rounded-3xl blur-2xl opacity-60"
                  animate={{
                    opacity: [0.4, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative">
                  <TextGenerateEffect
                    words="You Still Have a Lot of Time"
                    className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight sm:leading-tight md:leading-tight tracking-tight bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 bg-clip-text text-transparent"
                    duration={0.03}
                  />
                </div>
              </div>

              {/* Description Text */}
              <motion.p
                variants={itemVariants}
                className="max-w-3xl text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-light tracking-wide"
              >
                Collect notes, videos, and sources in one unified workspace.
                Generate comprehensive study materials with cutting-edge AI
                technology. Master any subject efficiently and confidently.
              </motion.p>

              {/* Feature Badges */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4"
              >
                {[
                  { icon: "📚", label: "Smart Notes" },
                  { icon: "🎯", label: "AI-Powered" },
                  { icon: "⚡", label: "Lightning Fast" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.08, y: -3 }}
                    whileTap={{ scale: 0.96 }}
                    className="group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-500/30 hover:border-violet-400/60 hover:from-violet-500/25 hover:to-indigo-500/25 transition-all duration-200 shadow-lg group-hover:shadow-violet-500/20">
                      <span className="text-base sm:text-lg">
                        {feature.icon}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-slate-50 transition-colors">
                        {feature.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.header>

          {/* Decorative Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
          />

          {/* Enhanced Tab Switcher */}
          <motion.div
            variants={tabContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex justify-center"
          >
            <div className="relative inline-block">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/25 to-indigo-600/25 rounded-full blur-2xl opacity-60" />

              <motion.div
                className="relative inline-flex gap-1.5 sm:gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-950/70 p-2 sm:p-3 shadow-2xl backdrop-blur-3xl"
                whileHover={{
                  borderColor: "rgb(167, 139, 250)",
                  boxShadow:
                    "0 20px 25px -5px rgb(167, 139, 250, 0.1), 0 0 20px rgba(167, 139, 250, 0.1)",
                }}
                transition={{ duration: 0.3 }}
              >
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center justify-center gap-2 rounded-full px-4 sm:px-7 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all duration-200 outline-none"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {/* Active Tab: Animated gradient background */}
                    {activeTab === tab.id && (
                      <>
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ["−100%", "100%"],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        {/* Glow pulse */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 opacity-40 blur-md"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </>
                    )}

                    {/* Tab Content */}
                    <motion.div
                      className={`relative z-10 flex items-center gap-2 transition-all duration-200 ${
                        activeTab === tab.id
                          ? "text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      animate={{
                        letterSpacing: activeTab === tab.id ? "0.05em" : "0em",
                      }}
                    >
                      <motion.span
                        animate={{
                          scale: activeTab === tab.id ? 1.25 : 1,
                          rotate: activeTab === tab.id ? 12 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        {tab.icon}
                      </motion.span>
                      <span className="font-semibold">{tab.label}</span>
                    </motion.div>

                    {/* Inactive Tab Hover Line */}
                    {activeTab !== tab.id && (
                      <motion.div
                        className="absolute bottom-1.5 left-1/2 h-1 bg-gradient-to-r from-violet-400/0 via-violet-400/60 to-violet-400/0 rounded-full w-2/5 -translate-x-1/2"
                        initial={{ opacity: 0, scaleX: 0 }}
                        whileHover={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom Decorative Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
          />

          {/* Content Area with Smooth Transitions */}
          <motion.div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                }}
              >
                {activeTab === "notes" && (
                  <Workspace onSourcesChange={setSourcesCount} />
                )}
                {activeTab === "report" && (
                  <ReportTab sourcesCount={sourcesCount} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
