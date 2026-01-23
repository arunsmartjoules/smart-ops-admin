import {
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Clock,
  MapPin,
  Laptop,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
  user?: string;
  module?: string;
  action?: string;
  site?: string;
}

interface RecentActivityProps {
  logs: ActivityLog[];
  loading?: boolean;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
    case "error":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
    case "success":
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />;
    case "info":
    default:
      return <Activity className="h-3.5 w-3.5 text-blue-600" />;
  }
};

const getActivityStyles = (type: string) => {
  switch (type) {
    case "warning":
      return {
        bg: "bg-amber-50",
        border: "border-amber-100",
        ring: "ring-amber-50",
      };
    case "error":
      return { bg: "bg-red-50", border: "border-red-100", ring: "ring-red-50" };
    case "success":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-100",
        ring: "ring-emerald-50",
      };
    case "info":
    default:
      return {
        bg: "bg-blue-50",
        border: "border-blue-100",
        ring: "ring-blue-50",
      };
  }
};

export function RecentActivity({ logs, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card className="col-span-full border-zinc-100/80 bg-white shadow-sm h-full">
        <CardHeader className="py-3 px-4 border-b border-zinc-50">
          <CardTitle className="text-sm font-semibold text-zinc-900">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-zinc-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 bg-zinc-100 rounded" />
                  <div className="h-2 w-1/3 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback if no logs
  const displayLogs =
    logs.length > 0
      ? logs
      : [
          {
            id: "1",
            type: "info",
            message: "System initialized successfully",
            timestamp: new Date().toISOString(),
            user: "System",
            module: "Core",
            action: "INIT",
            site: "GLOBAL",
          } as ActivityLog,
        ];

  return (
    <Card className="col-span-full border-zinc-100/80 bg-white shadow-sm flex flex-col">
      <CardHeader className="py-3 px-5 border-b border-zinc-50 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            Live Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Real-time
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="relative pl-5 pr-5 py-4">
            {/* Continuous Timeline Line */}
            <div className="absolute left-[28px] top-4 bottom-4 w-px bg-zinc-200" />

            <div className="space-y-6 relative">
              {displayLogs.map((log, index) => {
                const styles = getActivityStyles(log.type);
                return (
                  <div
                    key={log.id || index}
                    className="group relative flex gap-3"
                  >
                    {/* Icon Bubble */}
                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-300 group-hover:scale-110",
                        styles.bg,
                        styles.border,
                      )}
                    >
                      {getActivityIcon(log.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-zinc-50/80 transition-colors -ml-2 -mt-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-medium text-zinc-900 leading-snug wrap-break-word">
                            {log.message}
                          </p>
                          <span className="shrink-0 text-[10px] font-medium text-zinc-400 tabular-nums">
                            {formatDistanceToNow(new Date(log.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        {/* Metadata Tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {log.site && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 text-zinc-400" />
                              <span className="text-[10px] text-zinc-500">
                                {log.site}
                              </span>
                            </div>
                          )}
                          {log.user && (
                            <div className="flex items-center gap-1">
                              <User className="h-2.5 w-2.5 text-zinc-400" />
                              <span className="text-[10px] text-zinc-500">
                                {log.user}
                              </span>
                            </div>
                          )}
                          {log.module && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded border border-zinc-200 font-medium uppercase">
                              {log.module}
                            </span>
                          )}
                          {log.action && (
                            <span
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider rounded border ml-auto",
                                log.type === "error"
                                  ? "bg-red-50 text-red-700 border-red-100"
                                  : "bg-zinc-50 text-zinc-600 border-zinc-200",
                              )}
                            >
                              {log.action}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
