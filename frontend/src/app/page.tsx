"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { TextGenerateEffect } from "@/components/TextGenerateEffect";
import ReportTab from "@/components/ReportTab";

const Workspace = dynamic(() => import("@/components/Workspace"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
      <p className="text-slate-400">Loading workspace...</p>
    </div>
  ),
});

type TabType = "notes" | "report";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("notes");
  const [sourcesCount, setSourcesCount] = useState(0);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "notes", label: "Notes", icon: <Pencil size={18} /> },
    { id: "report", label: "Report", icon: <FileText size={18} /> },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/Logo.png"
              alt="Just Before Exam Logo"
              width={172}
              height={118}
              className="h-8 w-auto sm:h-10"
              priority
            />
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400 sm:text-sm">
              Just Before Exam
            </p>
          </div>
          <TextGenerateEffect
            words="You still have a lot of Time"
            className="block text-3xl font-bold sm:text-5xl text-slate-100"
            duration={0.05}
          />
          <p className="max-w-3xl text-sm text-slate-400 sm:text-base">
            Collect notes, videos, and sources in one place. Generate comprehensive study materials with AI.
          </p>
        </header>

        {/* Glassmorphic Tab Switcher - Centered & Sticky */}
        <div className="sticky top-4 z-40 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex gap-1 rounded-full border border-slate-700/50 bg-slate-900/70 p-1 shadow-xl backdrop-blur-xl"
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated background highlight */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-violet-500/30 via-indigo-500/30 to-violet-500/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Content */}
                <span className={`relative z-10 flex items-center gap-2 transition-colors ${activeTab === tab.id
                  ? "text-violet-300"
                  : "text-slate-400 hover:text-slate-200"
                  }`}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>


        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "notes" && <Workspace onSourcesChange={setSourcesCount} />}
            {activeTab === "report" && <ReportTab sourcesCount={sourcesCount} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
