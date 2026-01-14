"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  MapPin,
  History,
  Activity,
  ChevronRight,
  Loader2,
  Server,
  Database,
  Clock,
} from "lucide-react";
import { apiFetch, safeJsonParse } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BACKEND_URL } from "@/lib/api";

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Home() {
  const [stats, setStats] = useState({
    users: 0,
    sites: 0,
    logs: 0,
    loading: true,
  });
  const [health, setHealth] = useState<{
    status: string;
    server: { status: string; uptimeFormatted: string; responseTime: number };
    database: { status: string };
    loading: boolean;
  }>({
    status: "unknown",
    server: { status: "unknown", uptimeFormatted: "-", responseTime: 0 },
    database: { status: "unknown" },
    loading: true,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, sitesRes, logsRes] = await Promise.all([
          apiFetch("/api/users"),
          apiFetch("/api/sites"),
          apiFetch("/api/logs?limit=5"),
        ]);

        const usersData = await safeJsonParse(usersRes);
        const sitesData = await safeJsonParse(sitesRes);
        const logsData = await safeJsonParse(logsRes);

        setStats({
          users: usersData.pagination?.total || usersData.data?.length || 0,
          sites: sitesData.data?.length || 0,
          logs: logsData.pagination?.total || 0,
          loading: false,
        });

        // Get recent logs for activity section
        if (logsData.data && logsData.data.length > 0) {
          setRecentLogs(logsData.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    const fetchHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        const data = await safeJsonParse(res);
        setHealth({
          status: data.status || "unknown",
          server: data.server || {
            status: "unknown",
            uptimeFormatted: "-",
            responseTime: 0,
          },
          database: data.database || { status: "unknown" },
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch health", error);
        setHealth((prev) => ({
          ...prev,
          status: "offline",
          server: { status: "offline", uptimeFormatted: "-", responseTime: 0 },
          loading: false,
        }));
      }
    };

    fetchStats();
    fetchHealth();

    // Refresh health every 30 seconds
    const healthInterval = setInterval(fetchHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to Smart Ops Admin Control Panel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {stats.loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats.users}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Registered in system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <MapPin className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {stats.loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats.sites}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Operational facilities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <History className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {stats.loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats.logs}</div>
            )}
            <p className="text-xs text-muted-foreground">Historical events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity
              className={`w-4 h-4 ${
                health.status === "healthy"
                  ? "text-green-600"
                  : health.status === "offline"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            />
          </CardHeader>
          <CardContent>
            {health.loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    health.status === "healthy"
                      ? "text-green-600"
                      : health.status === "offline"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {health.status === "healthy"
                    ? "Online"
                    : health.status === "offline"
                    ? "Offline"
                    : "Degraded"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      health.database.status === "connected"
                        ? "text-green-600 border-green-200 bg-green-50"
                        : "text-red-600 border-red-200 bg-red-50"
                    }`}
                  >
                    <Database className="w-3 h-3 mr-1" />
                    DB {health.database.status === "connected" ? "OK" : "Error"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-zinc-600 border-zinc-200"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {health.server.uptimeFormatted}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                recentLogs.map((log, i) => (
                  <div key={log.id || i} className="flex items-center">
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-full ${
                        log.action?.includes("LOGIN")
                          ? "bg-green-100 text-green-600"
                          : log.action?.includes("LOGOUT")
                          ? "bg-yellow-100 text-yellow-600"
                          : log.action?.includes("CREATE")
                          ? "bg-blue-100 text-blue-600"
                          : log.action?.includes("DELETE")
                          ? "bg-red-100 text-red-600"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="ml-4 space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">
                        {log.action?.replace(/_/g, " ") || "Activity"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {log.description || log.module || "System event"}
                      </p>
                    </div>
                    <div className="ml-4 font-medium text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(log.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 text-white bg-linear-to-br from-red-600 to-red-800">
          <CardHeader>
            <CardTitle>Admin Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => router.push("/sites")}
              className="w-full h-12 px-4 flex items-center justify-between rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <span>Create New Site</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push("/users")}
              className="w-full h-12 px-4 flex items-center justify-between rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <span>Manage System Users</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push("/logs")}
              className="w-full h-12 px-4 flex items-center justify-between rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <span>Review Audit Logs</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
