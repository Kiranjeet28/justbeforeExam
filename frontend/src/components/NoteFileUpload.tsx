"use client";

import { useRef, useState } from "react";
import { CloudUpload, Loader, CheckCircle } from "lucide-react";

const ACCEPTED_FORMATS = [".pdf", ".docx", ".txt"];
const MAX_SIZE_MB = 50;

export default function NoteFileUpload() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (file: File) => {
        setError(null);
        if (!ACCEPTED_FORMATS.some((ext) => file.name.endsWith(ext))) {
            setError("Unsupported file type. Please upload PDF, DOCX, or TXT.");
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`File too large. Max size is ${MAX_SIZE_MB} MB.`);
            return;
        }
        setUploading(true);
        setProgress(0);
        setSuccess(false);
        // Simulate upload
        for (let i = 1; i <= 10; i++) {
            await new Promise((r) => setTimeout(r, 80));
            setProgress(i * 10);
        }
        setUploading(false);
        setSuccess(true);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-6 bg-white/10 rounded-xl shadow-lg flex flex-col items-center">
            <div
                className={`w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center transition-colors duration-200 ${dragActive ? "border-blue-400 bg-blue-50/10" : "border-gray-400 bg-transparent"}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{ cursor: "pointer" }}
            >
                <CloudUpload size={48} className="text-blue-400 mb-2" />
                <p className="text-lg font-medium text-gray-200 mb-2">Drag & drop your file here</p>
                <p className="text-gray-400 text-sm mb-2">or</p>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                    }}
                >
                    Select File to Upload
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_FORMATS.join(",")}
                    className="hidden"
                    onChange={onChange}
                />
                <p className="text-xs text-gray-400 mt-2">Max size: {MAX_SIZE_MB} MB. Supported: PDF, DOCX, TXT.</p>
            </div>
            {uploading && (
                <div className="w-full mt-4 flex flex-col items-center">
                    <Loader className="animate-spin text-blue-400 mb-2" />
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                            className="bg-blue-500 h-2.5 rounded-full transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-gray-300 mt-1">Uploading... {progress}%</span>
                </div>
            )}
            {success && (
                <div className="w-full mt-4 flex flex-col items-center">
                    <CheckCircle className="text-green-400 mb-1" />
                    <span className="text-green-300 text-sm">Upload successful!</span>
                </div>
            )}
            {error && (
                <div className="w-full mt-4 flex flex-col items-center">
                    <span className="text-red-400 text-sm">{error}</span>
                </div>
            )}
            <div className="w-full mt-8 text-xs text-gray-400 text-center border-t border-gray-700 pt-4">
                By uploading this file, you agree that your document will be securely stored in our database for processing and note generation purposes.
            </div>
        </div>
    );
}
