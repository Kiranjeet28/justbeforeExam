'use client';

import dynamic from 'next/dynamic';

const WorkspaceCompletePremium = dynamic(
    () => import('@/components/WorkspaceCompletePremium').then(mod => ({ default: mod.WorkspaceCompletePremium })),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
                        <p className="text-slate-300">Loading...</p>
                    </div>
                </div>
            </div>
        ),
    }
);

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
            <WorkspaceCompletePremium />
        </main>
    );
}
