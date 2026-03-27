"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TextGenerateEffectProps {
    words: string;
    className?: string;
    duration?: number;
}

export const TextGenerateEffect = ({
    words,
    className = "",
    duration = 0.05,
}: TextGenerateEffectProps) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex <= words.length) {
                setDisplayedText(words.substring(0, currentIndex));
                currentIndex++;
            } else {
                setIsComplete(true);
                clearInterval(interval);
            }
        }, duration * 1000);

        return () => clearInterval(interval);
    }, [words, duration]);

    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={className}
        >
            {displayedText}
            {!isComplete && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block ml-1"
                >
                    |
                </motion.span>
            )}
        </motion.span>
    );
};
