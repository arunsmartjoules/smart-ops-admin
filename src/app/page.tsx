"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch, safeJsonParse } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

// Dashboard Components
import { KPIGrid } from "@/components/dashboard/kpi-grid";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { RecentActivity } from "@/components/dashboard/recent-activity";

// Helper: Aggregate tickets by day for current month
function aggregateTicketsByDay(tickets: any[]): Record<string, number> {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyData: Record<string, number> = {};

  // Initialize all days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    dailyData[dateKey] = 0;
  }

  // Count tickets per day
  tickets.forEach((ticket) => {
    const createdAt = new Date(ticket.created_at);
    if (
      createdAt.getMonth() === currentMonth &&
      createdAt.getFullYear() === currentYear
    ) {
      const dateKey = createdAt.toISOString().split("T")[0];
      if (dailyData[dateKey] !== undefined) {
        dailyData[dateKey]++;
      }
    }
  });

  return dailyData;
}

// Helper: Group tickets by category
function groupTicketsByCategory(
  tickets: any[],
): { name: string; value: number; color: string }[] {
  const categoryColors: Record<string, string> = {
    HVAC: "#3b82f6",
    Electrical: "#f59e0b",
    Plumbing: "#10b981",
    IT: "#8b5cf6",
    Mechanical: "#ec4899",
    General: "#6b7280",
    Other: "#71717a",
  };

  const categoryCounts: Record<string, number> = {};
  tickets.forEach((ticket) => {
    const category = ticket.category || "Other";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || "#6b7280",
  }));
}

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
    siteLogs: [],
    attendanceReport: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Calculate date range for attendance report (1st of current month to today)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateFrom = firstDay.toISOString().split("T")[0];
        const dateTo = now.toISOString().split("T")[0];

        const [
          usersRes,
          sitesRes,
          assetsRes,
          ticketsRes,
          pmRes,
          logsRes,
          siteLogsRes,
          attendanceRes,
        ] = await Promise.all([
          apiFetch("/api/users"),
          apiFetch("/api/sites"),
          apiFetch("/api/assets"),
          apiFetch("/api/tickets"),
          apiFetch("/api/pm-instances"),
          apiFetch("/api/logs?limit=100"),
          apiFetch("/api/site-logs"),
          apiFetch(
            `/api/attendance/overall-report?date_from=${dateFrom}&date_to=${dateTo}`,
          ),
        ]);

        const [u, s, a, t, pm, l, sl, att] = await Promise.all([
          safeJsonParse(usersRes),
          safeJsonParse(sitesRes),
          safeJsonParse(assetsRes),
          safeJsonParse(ticketsRes),
          safeJsonParse(pmRes),
          safeJsonParse(logsRes),
          safeJsonParse(siteLogsRes),
          safeJsonParse(attendanceRes),
        ]);

        setData({
          users: u.data || [],
          sites: s.data || [],
          assets: a.data || [],
          tickets: t.data || [],
          pmInstances: pm.data || [],
          logs: l.data || [],
          siteLogs: sl.data || [],
          attendanceReport: att.data || [],
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
    const openTickets = data.tickets.filter(
      (t: any) => t.status === "Open" || t.status === "Inprogress",
    ).length;
    const criticalTickets = data.tickets.filter(
      (t: any) =>
        (t.status === "Open" || t.status === "Inprogress") &&
        t.priority === "Critical",
    ).length;

    const pendingPMs = data.pmInstances.filter(
      (pm: any) => pm.status !== "Completed",
    ).length;

    // Count Check-ins Today (real data)
    const today = new Date().toISOString().split("T")[0];
    const checkInsToday = new Set(
      data.attendanceReport
        .filter((record: any) => record.date === today)
        .map((record: any) => record.user_id),
    ).size;

    // Pending site logs: simplified - could be enhanced with schedule comparison
    const pendingSiteLogs = Math.max(0, 10 - data.siteLogs.length); // Mock: assume 10 expected daily

    return {
      totalUsers: data.users.length,
      totalSites: data.sites.length,
      totalAssets: data.assets.length,
      totalTickets: data.tickets.length,
      openTickets,
      criticalTickets,
      checkInToday: checkInsToday,
      pendingPMs,
      pendingSiteLogs,
    };
  }, [data]);

  // Aggregate chart data
  const chartData = useMemo(() => {
    // 1. Ticket Counts per Day
    const dailyTicketCounts = aggregateTicketsByDay(data.tickets);

    // 2. Check-in Counts per Day (from attendance report)
    const dailyCheckInCounts: Record<string, Set<string>> = {};
    data.attendanceReport.forEach((record: any) => {
      // Assuming record.date is "YYYY-MM-DD"
      if (!dailyCheckInCounts[record.date]) {
        dailyCheckInCounts[record.date] = new Set();
      }
      dailyCheckInCounts[record.date].add(record.user_id);
    });

    // 3. Merge for Composed Chart
    const ticketsByDay = Object.keys(dailyTicketCounts)
      .sort()
      .slice(0, new Date().getDate()) // Only up to today
      .map((dateString) => {
        const date = new Date(dateString);
        return {
          date: date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          }),
          tickets: dailyTicketCounts[dateString] || 0,
          checkIns: dailyCheckInCounts[dateString]?.size || 0,
        };
      });

    const ticketsByCategory = groupTicketsByCategory(data.tickets);

    return { ticketsByDay, ticketsByCategory };
  }, [data.tickets, data.attendanceReport]);

  // Format logs for activity feed
  const activityLogs = useMemo(() => {
    return data.logs.slice(0, 10).map((log: any) => ({
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

      {/* Row 1: Daily Operations KPIs */}
      <KPIGrid stats={stats} loading={loading} variant="operations" />

      {/* Row 2: Charts Section */}
      <ChartsSection
        loading={loading}
        ticketsByDay={chartData.ticketsByDay}
        ticketsByCategory={chartData.ticketsByCategory}
      />

      {/* Row 3: Inventory KPIs */}
      <KPIGrid stats={stats} loading={loading} variant="inventory" />

      {/* Row 4: Recent Activity Feed */}
      <RecentActivity logs={activityLogs} loading={loading} />
    </div>
  );
}
