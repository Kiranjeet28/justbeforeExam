import Workspace from "@/components/Workspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            justBeforExam
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            AI-Powered Study Workspace
          </h1>
          <p className="max-w-3xl text-slate-300">
            Week 1 scaffold for collecting tabs, notes, and videos in one place.
          </p>
        </header>

        <Workspace />
      </div>
    </main>
  );
}
