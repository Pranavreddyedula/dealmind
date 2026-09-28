"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDealMind } from "./store";
import { Sidebar, MobileNav } from "./sidebar";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { DashboardView } from "./views/dashboard";
import { CustomersView } from "./views/customers";
import { ConversationsView } from "./views/conversations";
import { MemoryView } from "./views/memory";
import { MeetingPrepView } from "./views/meeting-prep";
import { FollowupsView } from "./views/followups";
import { AnalyticsView } from "./views/analytics";
import { SettingsView } from "./views/settings";
import { useEffect, useState } from "react";
import { api } from "./api";

export function AppShell() {
  const { view } = useDealMind();
  const [bootstrapped, setBootstrapped] = useState(false);

  // Auto-seed on first load so the demo has data.
  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);
    api
      .customers.list()
      .then((r) => {
        if (r.customers.length === 0) {
          return api.seed(false);
        }
        return null;
      })
      .catch(() => {});
  }, [bootstrapped]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex flex-1 w-full">
        <Sidebar />
        <MobileNav />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 px-4 md:px-6 py-4 md:py-6 max-w-[1400px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {view === "dashboard" && <DashboardView />}
                {view === "customers" && <CustomersView />}
                {view === "conversations" && <ConversationsView />}
                {view === "memory" && <MemoryView />}
                {view === "meeting-prep" && <MeetingPrepView />}
                {view === "followups" && <FollowupsView />}
                {view === "analytics" && <AnalyticsView />}
                {view === "settings" && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
