"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  Database,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Lock,
  MessageSquare,
  Terminal,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: string;
  icon: string;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  service: string;
}

interface MetricsData {
  timestamp: string;
  system: {
    cpuUsage: number;
    memory: {
      usedMb: number;
      totalMb: number;
      percentage: number;
    };
    uptime: number;
    loadAvg: number[];
    platform: string;
    release: string;
  };
  process: {
    uptime: number;
    version: string;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
  services: ServiceStatus[];
  logs: LogEntry[];
}

// Helper to get icon component
const getIcon = (name: string) => {
  const Icon = (Icons as any)[name];
  return Icon || Activity;
};

export function ServerMonitor() {
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<MetricsData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiFetch("/api/system/metrics");
        if (!res.ok) throw new Error("Failed to fetch metrics");
        const json = await res.json();

        if (json.success) {
          const data = json.data;
          setLatestMetrics(data);

          setMetricsHistory((prev) => {
            const newHistory = [
              ...prev,
              {
                time: new Date(data.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
                cpu: data.system.cpuUsage,
                memory: data.system.memory.percentage,
              },
            ];
            return newHistory.slice(-30);
          });
          setIsConnected(true);
          setError(null);
        }
      } catch (err: any) {
        setIsConnected(false);
        setError(err.message);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!latestMetrics && !error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-red-600 border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">
            Connecting to system telemetry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Layer: Critical Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Runtime Status"
          value="Operational"
          subValue={`Uptime: ${Math.floor(latestMetrics?.system.uptime || 0 / 3600)}h`}
          icon={<Server size={16} />}
          status="success"
        />
        <MetricCard
          title="CPU Core Load"
          value={`${latestMetrics?.system.cpuUsage.toFixed(1)}%`}
          subValue={`Avg: ${latestMetrics?.system.loadAvg[0].toFixed(2)}`}
          icon={<Cpu size={16} />}
          status={
            (latestMetrics?.system.cpuUsage || 0) > 80 ? "warning" : "default"
          }
        />
        <MetricCard
          title="Memory Footprint"
          value={`${latestMetrics?.system.memory.percentage.toFixed(1)}%`}
          subValue={`${latestMetrics?.system.memory.usedMb}MB / ${latestMetrics?.system.memory.totalMb}MB`}
          icon={<HardDrive size={16} />}
          status={
            (latestMetrics?.system.memory.percentage || 0) > 90
              ? "danger"
              : "default"
          }
        />
        <MetricCard
          title="Process Horizon"
          value={latestMetrics?.process.version || "N/A"}
          subValue={`RSS: ${latestMetrics?.process.memory.rss}MB`}
          icon={<Activity size={16} />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Resource Timeline */}
        <Card className="md:col-span-8 bg-zinc-950 text-zinc-100 border-zinc-800 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Activity size={14} className="text-red-500" />
                  Resource Timeline
                </CardTitle>
                <CardDescription className="text-zinc-500 text-[10px] mt-1">
                  High-frequency utilization tracking
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-zinc-700 text-zinc-400"
              >
                Live 3s Poll
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#27272a"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ fontSize: "12px", fontFamily: "monospace" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#colorCpu)"
                    name="CPU"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorMem)"
                    name="Memory"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Matrix */}
        <Card className="md:col-span-4 border-zinc-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap size={16} className="text-amber-500 fill-amber-500" />
              Service Matrix
            </CardTitle>
            <CardDescription className="text-[10px]">
              Real-time dependency health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestMetrics?.services.map((service, idx) => {
              const Icon = getIcon(service.icon);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-1.5 rounded-md",
                        service.status === "healthy"
                          ? "bg-zinc-100 text-zinc-600"
                          : "bg-amber-50 text-amber-600",
                      )}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">
                        {service.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {service.latency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        service.status === "healthy"
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "bg-amber-500 animate-pulse",
                      )}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {service.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Log Observatory */}
        <Card className="md:col-span-12 border-zinc-200 shadow-xl overflow-hidden">
          <CardHeader className="bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-red-700" />
              <CardTitle className="text-sm font-bold">
                Log Observatory
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-zinc-500 font-medium">
                  Info
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-[10px] text-zinc-500 font-medium">
                  Warn
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] text-zinc-500 font-medium">
                  Error
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto font-mono text-[11px] divide-y divide-zinc-50">
              {latestMetrics?.logs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-3 hover:bg-zinc-50/50 transition-colors group"
                >
                  <span className="text-zinc-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={cn(
                      "font-bold uppercase tracking-wider w-12 shrink-0",
                      log.level === "info"
                        ? "text-blue-500"
                        : log.level === "warn"
                          ? "text-amber-500"
                          : "text-red-500",
                    )}
                  >
                    [{log.level.slice(0, 3)}]
                  </span>
                  <span className="text-zinc-500 font-bold shrink-0 w-24">
                    @{log.service}
                  </span>
                  <span className="text-zinc-700 flex-1 break-all">
                    {log.message}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
              {latestMetrics?.logs.length === 0 && (
                <div className="p-10 text-center text-zinc-400 italic">
                  No logs found in buffer
                </div>
              )}
            </div>
          </CardContent>
          <div className="bg-zinc-50 border-t border-zinc-100 p-2 px-4 flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
              Buffer: {latestMetrics?.logs.length}/50 Logstream
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear View
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subValue,
  icon,
  status = "default",
}: {
  title: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  status?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-2 rounded-md",
            status === "default" && "bg-zinc-100 text-zinc-600",
            status === "success" && "bg-emerald-50 text-emerald-600",
            status === "warning" && "bg-amber-50 text-amber-600",
            status === "danger" && "bg-red-50 text-red-600",
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black tracking-tight text-zinc-900">
          {value}
        </div>
        <p className="text-[10px] font-medium text-zinc-500 mt-1">{subValue}</p>
      </CardContent>
    </Card>
  );
}
