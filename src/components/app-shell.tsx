'use client';
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";

export function AppShell({
  children,
  role
}: {
  children: React.ReactNode;
  role: 'admin' | 'client' | 'driver';
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar role={role} />
      <div className="flex flex-col">
        <Header role={role} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background/60 dark:bg-background/20">
          {children}
        </main>
      </div>
    </div>
  );
}
