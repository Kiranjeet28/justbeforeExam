/**
 * INTEGRATION EXAMPLE: Using EnhancedNoteView with Existing Components
 * 
 * This file demonstrates how to integrate the new EnhancedNoteView component
 * with your existing data fetching logic from Workspace.tsx or GenerateReport.tsx
 * 
 * NO CHANGES NEEDED TO DATA FETCHING - just swap the display component!
 */

import EnhancedNoteView from "@/components/EnhancedNoteView";
import { buildRagContextFromLinks } from "@/lib/buildRagContext";
import { generateExamNotes } from "@/lib/generateExamNotes";
import type { ParsedLink } from "@/lib/parseLinkContent";
import { useState } from "react";

// ============================================================================
// OPTION 1: Replace ReportViewer with EnhancedNoteView
// ============================================================================

/**
 * Example integration in Workspace.tsx
 * Replace the existing ReportViewer with EnhancedNoteView
 */
function WorkspaceWithEnhancedView() {
    const [linkSources] = useState<ParsedLink[]>([]);
    const [isRagGenerating, setIsRagGenerating] = useState(false);
    const [ragMarkdown, setRagMarkdown] = useState("");
    const [ragModel, setRagModel] = useState("");
    const [ragModalOpen, setRagModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateExamNotes = async () => {
        if (linkSources.length === 0) return;

        setIsRagGenerating(true);
        setError(null);

        try {
            // Build context from all links (same as before)
            const content = buildRagContextFromLinks(linkSources);
            console.log("🚀 Starting exam notes generation...");

            // Fetch notes from backend (same as before)
            const { markdown, model } = await generateExamNotes(content);
            console.log("✅ Model used:", model);

            // Store data and open enhanced view
            setRagMarkdown(markdown);
            setRagModel(model);
            setRagModalOpen(true);
        } catch (err) {
            console.error("❌ Error generating exam notes:", err);
            setError(err instanceof Error ? err.message : "Failed to generate exam notes.");
        } finally {
            setIsRagGenerating(false);
        }
    };

    return (
        <>
            {/* Your existing UI... */}
            <button onClick={handleGenerateExamNotes}>Generate Notes</button>

            {/* REPLACE ReportViewer with EnhancedNoteView */}
            {ragModalOpen && (
                <EnhancedNoteView
                    noteData={ragMarkdown}
                    isLoading={isRagGenerating}
                    error={error}
                    title={`Exam Notes - Generated with ${ragModel}`}
                    onClose={() => setRagModalOpen(false)}
                />
            )}
        </>
    );
}

// ============================================================================
// OPTION 2: Create a Dedicated Notes Generator Component
// ============================================================================

/**
 * New component combining generation and display
 * Use this for a more modular approach
 */
function EnhancedNotesGenerator({ linkSources }: { linkSources: ParsedLink[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [noteData, setNoteData] = useState("");
    const [model, setModel] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const context = buildRagContextFromLinks(linkSources);
            const result = await generateExamNotes(context);

            setNoteData(result.markdown);
            setModel(result.model);
            setIsOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleGenerate}
                disabled={linkSources.length === 0 || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
                {isLoading ? "Generating..." : "Generate Enhanced Notes"}
            </button>

            {isOpen && (
                <EnhancedNoteView
                    noteData={noteData}
                    isLoading={isLoading}
                    error={error}
                    title={`Study Notes - ${model}`}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

// ============================================================================
// OPTION 3: Use with Multiple Content Sources
// ============================================================================

/**
 * Example: Generate notes from different sources
 */
function MultiSourceNotesView() {
    const [noteData, setNoteData] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Example 1: From pasted text
    const generateFromText = async (text: string) => {
        try {
            const result = await generateExamNotes(text);
            setNoteData(result.markdown);
            setIsOpen(true);
        } catch (err) {
            console.error("Failed to generate notes:", err);
        }
    };

    // Example 2: From file upload
    const handleFileUpload = async (file: File) => {
        const text = await file.text();
        await generateFromText(text);
    };

    // Example 3: From user-provided content
    const handleCustomContent = async (userContent: string) => {
        await generateFromText(userContent);
    };

    return (
        <>
            <div className="space-y-4">
                <button onClick={() => handleCustomContent("Your content here")}>
                    Generate from Text
                </button>
                <input
                    type="file"
                    accept=".txt,.md"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
            </div>

            {isOpen && (
                <EnhancedNoteView
                    noteData={noteData}
                    title="Generated Study Notes"
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

// ============================================================================
// USAGE SUMMARY
// ============================================================================

/**
 * TO INTEGRATE INTO YOUR APP:
 * 
 * 1. Install dependencies:
 *    npm install katex remark-math remark-gfm rehype-katex
 * 
 * 2. Import the component:
 *    import EnhancedNoteView from "@/components/EnhancedNoteView";
 * 
 * 3. Replace your existing note/report viewer:
 *    OLD: <ReportViewer reportContent={content} ... />
 *    NEW: <EnhancedNoteView noteData={content} ... />
 * 
 * 4. That's it! All existing data fetching continues to work.
 *    No changes needed to your API calls or data flow.
 * 
 * KEY BENEFITS:
 * ✓ Multiple view modes (Notes, Cheat Sheet, Mind Map)
 * ✓ LaTeX formula support in cheat sheets
 * ✓ Export to multiple formats
 * ✓ No changes to your data fetching logic
 * ✓ Fully typed with TypeScript
 * ✓ Dark theme with responsive design
 * ✓ Accessible and performant
 */

export {
    WorkspaceWithEnhancedView,
    EnhancedNotesGenerator,
    MultiSourceNotesView,
};
