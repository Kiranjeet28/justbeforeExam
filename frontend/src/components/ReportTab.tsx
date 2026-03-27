"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";

interface ReportTabProps {
    sourcesCount: number;
}

export default function ReportTab({ sourcesCount }: ReportTabProps) {
    const hasContent = sourcesCount > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center min-h-125 rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-900/50 via-slate-900/30 to-slate-950/50 p-8 shadow-xl backdrop-blur-sm overflow-hidden relative"
        >
            {/* Animated background gradient */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-violet-500/20 to-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-linear-to-tr from-indigo-500/20 to-violet-500/20 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-lg">
                {/* Icon Container with glow effect */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6 flex justify-center"
                >
                    <motion.div
                        animate={hasContent ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0 0 rgba(168, 85, 247, 0)", "0 0 0 20px rgba(168, 85, 247, 0)", "0 0 0 0 rgba(168, 85, 247, 0)"] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative p-6 rounded-full bg-linear-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30"
                    >
                        <FileText size={56} className="text-violet-300" strokeWidth={1.5} />
                    </motion.div>
                </motion.div>

                {/* Main Text */}
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-3xl font-bold text-slate-100 mb-3"
                >
                    {hasContent ? "Generate Your Report" : "Ready to Generate Your Report?"}
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="text-slate-400 text-lg mb-8"
                >
                    {hasContent
                        ? `You have ${sourcesCount} source${sourcesCount !== 1 ? "s" : ""} ready. Click the button below to generate a comprehensive study document.`
                        : "Add your sources in the Notes tab first to build your context and create a comprehensive study document."}
                </motion.p>

                {/* CTA Button */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    disabled={!hasContent}
                    className={`relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 min-h-11 ${hasContent
                        ? "bg-linear-to-r from-violet-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-violet-500/50 hover:scale-105 cursor-pointer"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                        }`}
                    whileHover={hasContent ? { scale: 1.05 } : {}}
                    whileTap={hasContent ? { scale: 0.98 } : {}}
                >
                    {hasContent && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles size={18} />
                        </motion.div>
                    )}
                    {hasContent ? "Generate Final Document" : "Add Sources to Continue"}
                </motion.button>

                {/* Info Text */}
                {!hasContent && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="mt-6 text-sm text-slate-500"
                    >
                        ✨ The Report tab will become active once you add your first source
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
}
