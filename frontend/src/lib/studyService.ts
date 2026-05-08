/**
 * Unified Service Layer for justBeforExam
 * Abstracts between mock data and real API
 * Set USE_MOCK_DATA to false to use real backend APIs
 */

import { mockDataService } from "./mockDataService";
import type {
    MockQuiz,
    MockTopic,
    MockRecommendation,
    MockQuizResult,
} from "./mockDataService";

// Feature flag: Set to false to use real backend APIs
const USE_MOCK_DATA = true;

export interface StudyService {
    generateNotes: () => Promise<{ markdown: string; topics: MockTopic[] }>;
    getTopics: () => Promise<MockTopic[]>;
    generateQuiz: (topic?: string) => Promise<MockQuiz>;
    evaluateQuiz: (answers: Record<string, string>) => Promise<MockQuizResult>;
    getRecommendations: (
        weakAreas: string[]
    ) => Promise<MockRecommendation[]>;
    getNotes: () => string;
}

/**
 * Production service layer - calls real backend APIs
 */
const productionService: StudyService = {
    generateNotes: async () => {
        try {
            const response = await fetch("http://localhost:8000/api/generate-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (!response.ok) throw new Error("Failed to generate notes");

            const data = await response.json();

            return {
                markdown: data.markdown || data.content || "",
                topics: data.topics || [],
            };
        } catch (error) {
            console.error("Error generating notes:", error);
            throw error;
        }
    },

    getTopics: async () => {
        try {
            const response = await fetch(
                "http://localhost:8000/api/topics",
                { method: "GET" }
            );

            if (!response.ok) throw new Error("Failed to fetch topics");

            return await response.json();
        } catch (error) {
            console.error("Error fetching topics:", error);
            throw error;
        }
    },

    generateQuiz: async (topic?: string) => {
        try {
            const response = await fetch("http://localhost:8000/api/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic }),
            });

            if (!response.ok) throw new Error("Failed to generate quiz");

            return await response.json();
        } catch (error) {
            console.error("Error generating quiz:", error);
            throw error;
        }
    },

    evaluateQuiz: async (answers: Record<string, string>) => {
        try {
            const response = await fetch("http://localhost:8000/api/quiz/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers }),
            });

            if (!response.ok) throw new Error("Failed to evaluate quiz");

            return await response.json();
        } catch (error) {
            console.error("Error evaluating quiz:", error);
            throw error;
        }
    },

    getRecommendations: async (weakAreas: string[]) => {
        try {
            const response = await fetch(
                "http://localhost:8000/api/recommendations",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ weak_areas: weakAreas }),
                }
            );

            if (!response.ok) throw new Error("Failed to fetch recommendations");

            return await response.json();
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            throw error;
        }
    },

    getNotes: () => {
        // This is a fallback - in production, notes would come from API
        return "";
    },
};

/**
 * Select the appropriate service
 */
const studyService: StudyService = USE_MOCK_DATA
    ? mockDataService
    : productionService;

/**
 * Export the active service
 */
export default studyService;

/**
 * Helper to check if using mock data
 */
export const isUsingMockData = (): boolean => USE_MOCK_DATA;

/**
 * Helper to switch between mock and production (useful for debugging)
 */
export const setUseMockData = (useMock: boolean): void => {
    if (useMock) {
        console.log("⚠️  Switched to MOCK data service");
    } else {
        console.log("✅ Switched to PRODUCTION API service");
    }
    // In a real app, you might store this in localStorage or context
};
