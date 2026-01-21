import {
  Users,
  MapPin,
  Activity,
  Ticket,
  Thermometer,
  Zap,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  stats: {
    totalSites: number;
    activeSites: number;
    totalAssets: number;
    activeAssets: number;
    openTickets: number;
    criticalTickets: number;
    avgChillerCOP: number;
    activePMs: number;
    onlineStaff: number;
  };
  loading?: boolean;
}

export function KPIGrid({ stats, loading }: KPIGridProps) {
  const kpis = [
    {
      title: "Active Sites",
      value: stats.activeSites,
      total: stats.totalSites,
      icon: MapPin,
      color: "text-blue-600",
      bg: "bg-blue-50",
      subtext: `${stats.totalSites - stats.activeSites} inactive`,
      label: null,
    },
    {
      title: "Open Tickets",
      value: stats.openTickets,
      icon: Ticket,
      color: "text-red-600",
      bg: "bg-red-50",
      subtext: `${stats.criticalTickets} critical`,
      alert: stats.criticalTickets > 0,
      label: null,
    },
    {
      title: "Asset Status",
      value: stats.activeAssets,
      total: stats.totalAssets,
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
      subtext: `${stats.totalAssets} total registered`,
      label: null,
    },
    {
      title: "Pending PMs",
      value: stats.activePMs,
      icon: ClipboardList,
      color: "text-purple-600",
      bg: "bg-purple-50",
      subtext: "Due this week",
      label: null,
    },
    {
      title: "Staff Online",
      value: stats.onlineStaff,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      subtext: "Active now",
      label: null,
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 transition-all duration-300">
        {Array.from({ length: 5 }).map((_, i) => (
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 transition-all duration-300">
      {kpis.map((kpi) => (
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
              <div className="text-2xl font-bold text-zinc-900">
                {kpi.value}
              </div>
              {kpi.label && (
                <span className="text-xs font-medium text-zinc-500">
                  {kpi.label}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-zinc-500">{kpi.subtext}</p>
              {kpi.alert && (
                <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
