"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch, safeJsonParse, BACKEND_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

// Dashboard Components
import { KPIGrid } from "@/components/dashboard/kpi-grid";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    users: [],
    sites: [],
    assets: [],
    tickets: [],
    readings: [],
    logs: [],
    pmInstances: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          usersRes,
          sitesRes,
          assetsRes,
          ticketsRes,
          pmRes,
          readingsRes,
          logsRes,
        ] = await Promise.all([
          apiFetch("/api/users"),
          apiFetch("/api/sites"),
          apiFetch("/api/assets"),
          apiFetch("/api/tickets"),
          apiFetch("/api/pm-instances"),
          apiFetch("/api/chiller-readings"),
          apiFetch("/api/logs?limit=10"),
        ]);

        const [u, s, a, t, pm, r, l] = await Promise.all([
          safeJsonParse(usersRes),
          safeJsonParse(sitesRes),
          safeJsonParse(assetsRes),
          safeJsonParse(ticketsRes),
          safeJsonParse(pmRes),
          safeJsonParse(readingsRes),
          safeJsonParse(logsRes),
        ]);

        setData({
          users: u.data || [],
          sites: s.data || [],
          assets: a.data || [],
          tickets: t.data || [],
          pmInstances: pm.data || [],
          readings: r.data || [],
          logs: l.data || [],
        });
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats for KPIs
  const stats = useMemo(() => {
    const activeSites = data.sites.filter(
      (s: any) => s.status === "Active",
    ).length;
    const activeAssets = data.assets.filter(
      (a: any) => a.status === "Active",
    ).length;
    const openTickets = data.tickets.filter(
      (t: any) => t.status === "Open" || t.status === "Inprogress",
    ).length;
    const criticalTickets = data.tickets.filter(
      (t: any) =>
        (t.status === "Open" || t.status === "Inprogress") &&
        t.priority === "Critical",
    ).length;

    // Calculate average COP from readings
    const readingsWithCOP = data.readings.filter(
      (r: any) => r.cop && r.cop > 0,
    );
    const avgChillerCOP =
      readingsWithCOP.length > 0
        ? readingsWithCOP.reduce(
            (acc: number, curr: any) => acc + curr.cop,
            0,
          ) / readingsWithCOP.length
        : 0;

    // PMs due this week (simplified logic for now, just counting open instances)
    const activePMs = data.pmInstances.filter(
      (pm: any) => pm.status !== "Completed",
    ).length;

    return {
      totalSites: data.sites.length,
      activeSites,
      totalAssets: data.assets.length,
      activeAssets,
      openTickets,
      criticalTickets,
      avgChillerCOP,
      activePMs,
      onlineStaff: Math.floor(data.users.length * 0.8), // Mock online count
    };
  }, [data]);

  // Format logs for activity feed
  const activityLogs = useMemo(() => {
    return data.logs.map((log: any) => ({
      id: log.log_id,
      type:
        log.action_type === "ERROR"
          ? "error"
          : log.action_type === "WARNING"
            ? "warning"
            : "info",
      message: log.details || log.action_type,
      timestamp: log.created_at,
      user: log.performed_by_name || "System",
      module: log.module_name || "System",
      action: log.action,
      site: log.site_name,
    }));
  }, [data.logs]);

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6 pb-20 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="text-zinc-500">
          Welcome back, {user?.name || "Admin"}. Here's an overview of your
          facility operations.
        </p>
      </div>

      {/* KPI Grid */}
      <KPIGrid stats={stats} loading={loading} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 h-auto">
        {/* Charts Section - Takes up 5 columns on large screens */}
        <div className="col-span-full lg:col-span-5 space-y-6">
          <ChartsSection loading={loading} />
        </div>

        {/* Recent Activity - Takes up 2 columns on large screens */}
        <div className="col-span-full lg:col-span-2 min-h-[500px]">
          <RecentActivity logs={activityLogs} loading={loading} />
        </div>
      </div>
    </div>
  );
}
