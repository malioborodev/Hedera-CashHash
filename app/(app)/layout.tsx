"use client";
import { TopBar } from "./_components/TopBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <TopBar />
      <main>
        {children}
      </main>
    </div>
  );
}