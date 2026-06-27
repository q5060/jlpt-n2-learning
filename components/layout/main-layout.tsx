"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DbProvider } from "@/components/providers/db-provider";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <DbProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <MobileNav />
          <main className="mx-auto w-full max-w-6xl flex-1 overflow-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:p-6 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </DbProvider>
  );
}
