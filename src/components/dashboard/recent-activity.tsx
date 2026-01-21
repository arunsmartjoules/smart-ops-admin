import {
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Settings,
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
    case "error":
      return <AlertTriangle className="h-4 w-4 text-white" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-white" />;
    case "info":
    default:
      return <Activity className="h-4 w-4 text-white" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "warning":
      return "bg-amber-500 shadow-amber-500/30";
    case "error":
      return "bg-red-500 shadow-red-500/30";
    case "success":
      return "bg-green-500 shadow-green-500/30";
    case "info":
    default:
      return "bg-blue-500 shadow-blue-500/30";
  }
};

export function RecentActivity({ logs, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card className="col-span-3 border-zinc-100/80 bg-white shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-zinc-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-zinc-100 rounded" />
                  <div className="h-3 w-1/2 bg-zinc-100 rounded" />
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
    <Card className="col-span-full border-zinc-100/80 bg-white shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-red-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="space-y-6 pt-2">
            {displayLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="relative flex gap-4 transition-opacity duration-500"
              >
                {/* Timeline Line */}
                {index !== displayLogs.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%+24px)] w-[2px] bg-zinc-100" />
                )}

                {/* Icon Bubble */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-lg ring-4 ring-white",
                    getActivityColor(log.type),
                  )}
                >
                  {getActivityIcon(log.type)}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 break-words leading-tight">
                    {log.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono">
                      {formatDistanceToNow(new Date(log.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                    {log.action && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-zinc-900 uppercase text-[9px] bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">
                          {log.action}
                        </span>
                      </>
                    )}
                    {log.site && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] font-bold text-red-600">
                          {log.site}
                        </span>
                      </>
                    )}
                    {log.user && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded">
                          <User className="h-3 w-3" /> {log.user}
                        </span>
                      </>
                    )}
                    {log.module && (
                      <>
                        <span>•</span>
                        <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-400">
                          {log.module}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
