"use client";

import { useState } from "react";
import { Loader, Zap } from "lucide-react";
import ReportViewer from "./ReportViewer";

interface GenerateReportProps {
    sourceCount: number;
}

export default function GenerateReport({ sourceCount }: GenerateReportProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [reportContent, setReportContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showViewer, setShowViewer] = useState(false);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        setReportContent(null);
        setShowViewer(true);

        try {
            const response = await fetch("http://localhost:8000/api/generate-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    source_ids: [],
                    prompt: "",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.detail || `Failed to generate report (${response.status})`
                );
            }

            const data = await response.json();

            if (!data.success || !data.report) {
                throw new Error("Invalid response from server");
            }

            setReportContent(data.report);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Generate Button */}
            <div>
                <button
                    onClick={handleGenerateReport}
                    disabled={isLoading || sourceCount === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isLoading || sourceCount === 0
                            ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                        }`}
                >
                    {isLoading ? (
                        <>
                            <Loader size={18} className="animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Zap size={18} />
                            Generate Exam Report
                        </>
                    )}
                </button>
                {sourceCount === 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                        Add sources first to generate a report
                    </p>
                )}
            </div>

            {/* Report Viewer Modal */}
            {showViewer && (
                <ReportViewer
                    reportContent={reportContent}
                    isLoading={isLoading}
                    error={error}
                    onClose={() => setShowViewer(false)}
                    sourceCount={sourceCount}
                />
            )}
        </>
    );
}
