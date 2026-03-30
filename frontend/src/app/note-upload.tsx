import dynamic from "next/dynamic";

const NoteFileUpload = dynamic(() => import("@/components/NoteFileUpload"), { ssr: false });

export default function NoteFileUploadTab() {
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 sm:py-10 flex items-center justify-center">
            <NoteFileUpload />
        </main>
    );
}
