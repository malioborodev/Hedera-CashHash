"use client";
import { TopBar } from "./_components/TopBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <TopBar />
      <main>
        {children}
      </main>
    </div>
  );
}