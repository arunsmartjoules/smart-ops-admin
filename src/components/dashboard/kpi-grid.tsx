import {
  Users,
  MapPin,
  Ticket,
  Zap,
  ClipboardList,
  AlertTriangle,
  CalendarCheck,
  FileText,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  stats: {
    totalUsers: number;
    totalSites: number;
    totalAssets: number;
    totalTickets: number;
    openTickets: number;
    criticalTickets: number;
    checkInToday: number;
    pendingPMs: number;
    pendingSiteLogs: number;
  };
  loading?: boolean;
}

export function KPIGrid({
  stats,
  loading,
  variant = "operations",
}: KPIGridProps & { variant?: "inventory" | "operations" }) {
  // Row 1: Inventory & Volume ("The Big Numbers")
  const inventoryKPIs = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      subtext: "Registered users",
    },
    {
      title: "Total Sites",
      value: stats.totalSites,
      icon: MapPin,
      color: "text-blue-600",
      bg: "bg-blue-50",
      subtext: "Managed locations",
    },
    {
      title: "Total Assets",
      value: stats.totalAssets,
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50",
      subtext: "Registered equipment",
    },
    {
      title: "Tickets Created",
      value: stats.totalTickets,
      icon: Ticket,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      subtext: "Lifetime total",
    },
  ];

  // Row 2: Daily Operations ("Action Items")
  const operationsKPIs = [
    {
      title: "Open Tickets",
      value: stats.openTickets,
      icon: Ticket,
      color: "text-red-600",
      bg: "bg-red-50",
      subtext: `${stats.criticalTickets} critical`,
      alert: stats.criticalTickets > 0,
    },
    {
      title: "Check-in Today",
      value: stats.checkInToday,
      icon: CalendarCheck,
      color: "text-teal-600",
      bg: "bg-teal-50",
      subtext: "Staff active today",
    },
    {
      title: "Pending PMs",
      value: stats.pendingPMs,
      icon: ClipboardList,
      color: "text-purple-600",
      bg: "bg-purple-50",
      subtext: "Awaiting completion",
    },
    {
      title: "Pending Site Logs",
      value: stats.pendingSiteLogs,
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-50",
      subtext: "Not yet submitted",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse shadow-sm border-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-zinc-100 rounded" />
              <div className="h-4 w-4 bg-zinc-100 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-zinc-100 rounded mb-1" />
              <div className="h-3 w-20 bg-zinc-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const renderKPICard = (kpi: any) => (
    <Card
      key={kpi.title}
      className="hover:shadow-md transition-shadow duration-200 border-zinc-100/80 bg-white"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">
          {kpi.title}
        </CardTitle>
        <kpi.icon className={cn("h-4 w-4", kpi.color)} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-zinc-900">{kpi.value}</div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-zinc-500">{kpi.subtext}</p>
          {kpi.alert && (
            <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  const kpisToShow = variant === "inventory" ? inventoryKPIs : operationsKPIs;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {kpisToShow.map(renderKPICard)}
    </div>
  );
}
