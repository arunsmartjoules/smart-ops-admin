"use client";

import { useAuth } from "@/contexts/auth-context";
import { ServerMonitor } from "@/components/server-monitor";

export default function MonitoringPage() {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="h-full p-4 sm:p-6 overflow-y-auto bg-white/50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">System Monitor</h2>
        <p className="text-muted-foreground">
          Real-time server performance and health metrics.
        </p>
      </div>
      <ServerMonitor />
    </div>
  );
}
