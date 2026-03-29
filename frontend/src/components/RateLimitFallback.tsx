"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Clock } from "lucide-react";

interface RateLimitFallbackProps {
    retryAfter: number; // seconds
    retryAt: string; // ISO datetime string
    message: string;
    onRetry: () => void;
}

export function RateLimitFallback({
    retryAfter,
    retryAt,
    message,
    onRetry,
}: RateLimitFallbackProps) {
    const [secondsLeft, setSecondsLeft] = useState(retryAfter);
    const [isRetryReady, setIsRetryReady] = useState(false);

    useEffect(() => {
        // Update countdown every second
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    setIsRetryReady(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number): string => {
        if (seconds <= 0) return "Ready";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-red-500 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-red-900/20 border-b border-red-500/30 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={24} className="text-red-400" />
                        <h2 className="text-lg font-bold text-red-400">Rate Limited</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-300 text-center">{message}</p>

                    {/* Countdown Timer */}
                    <div className="bg-gray-800 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Clock size={20} className="text-blue-400" />
                            <span className="text-sm text-gray-400">Time until retry</span>
                        </div>
                        <div className="text-5xl font-mono font-bold text-blue-400">
                            {formatTime(secondsLeft)}
                        </div>
                    </div>

                    {/* Retry Details */}
                    <div className="text-xs text-gray-400 text-center space-y-1">
                        <p>Will be ready at:</p>
                        <p className="font-mono text-gray-300">
                            {new Date(retryAt).toLocaleTimeString()}
                        </p>
                    </div>

                    {/* Retry Button */}
                    <button
                        onClick={onRetry}
                        disabled={!isRetryReady}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors ${isRetryReady
                                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {isRetryReady ? "Retry Now" : "Waiting..."}
                    </button>

                    {/* Provider Info */}
                    <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-4">
                        <p>
                            All available AI providers (Groq, HuggingFace) are currently rate limited.
                        </p>
                        <p className="mt-2">
                            This is temporary. Please wait for the countdown or try again later.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
