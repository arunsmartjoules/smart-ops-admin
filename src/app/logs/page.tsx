"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  History as HistoryIcon,
  Search,
  SearchCode,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  User,
  Monitor,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCcw,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Date filter state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(pagination.page, searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [pagination.page, searchTerm, dateFrom, dateTo]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs(pagination.page, searchTerm);
    }, 10000);

    return () => clearInterval(interval);
  }, [pagination.page, searchTerm, autoRefresh, dateFrom, dateTo]);

  const fetchLogs = async (page: number, search: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const fromStr = dateFrom ? dateFrom.toISOString().split("T")[0] : "";
      const toStr = dateTo ? dateTo.toISOString().split("T")[0] : "";

      const res = await apiFetch(
        `/api/logs?page=${page}&limit=${pagination.limit}${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }${fromStr ? `&from=${fromStr}` : ""}${toStr ? `&to=${toStr}` : ""}`
      );

      // Safe JSON parsing
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = { success: false, error: text || "Failed to parse response" };
      }

      if (result.success) {
        setLogs(result.data || []);
        if (result.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          }));
        }
      } else {
        setError(result.error || "Failed to fetch logs");
        console.error("API error:", result.error);
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch logs");
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = [...logs].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const getActionColor = (action: string) => {
    if (action.includes("CREATE"))
      return "text-green-600 border-green-200 bg-green-50";
    if (action.includes("UPDATE"))
      return "text-blue-600 border-blue-200 bg-blue-50";
    if (action.includes("DELETE"))
      return "text-red-600 border-red-200 bg-red-50";
    if (action.includes("LOGIN") || action.includes("SIGNUP"))
      return "text-purple-600 border-purple-200 bg-purple-50";
    return "text-zinc-600 border-zinc-200 bg-zinc-50";
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Audit Logs
          </h1>
          <p className="text-zinc-500 mt-1">
            Monitor system activity, security events, and administrative
            changes.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <span>
            Showing{" "}
            <span className="text-zinc-900 font-bold">
              {filteredLogs.length}
            </span>{" "}
            of{" "}
            <span className="text-zinc-900 font-bold">{pagination.total}</span>{" "}
            records
          </span>
          <div className="flex items-center gap-1 ml-4 border rounded-lg p-0.5 bg-zinc-50/50">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white hover:shadow-sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4 text-zinc-600" />
            </Button>
            <span className="px-3 font-bold text-zinc-700 text-xs">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white hover:shadow-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search descriptions, actions, or user IDs..."
            className="pl-10 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-red-300 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "bg-zinc-50 border-zinc-200 font-bold text-xs uppercase tracking-tight h-10 px-4",
                  !dateFrom && "text-zinc-400"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {dateFrom ? format(dateFrom, "PPP") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "bg-zinc-50 border-zinc-200 font-bold text-xs uppercase tracking-tight h-10 px-4",
                  !dateTo && "text-zinc-400"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {dateTo ? format(dateTo, "PPP") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-zinc-400 hover:text-red-600"
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "font-bold text-[10px] uppercase tracking-widest h-10 px-4 transition-all",
              autoRefresh
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-sm"
                : "bg-zinc-50 text-zinc-400 border-zinc-200"
            )}
          >
            <RefreshCcw
              className={cn(
                "mr-2 h-3.5 w-3.5",
                autoRefresh && "animate-spin-slow"
              )}
            />
            {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-zinc-200 hover:bg-zinc-100"
            onClick={() => fetchLogs(pagination.page)}
          >
            <HistoryIcon className="h-4 w-4 text-zinc-500" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="border-separate border-spacing-0">
            <TableHeader className="bg-zinc-50 sticky top-0 z-20">
              <TableRow>
                <TableHead className="w-[180px] bg-zinc-50 text-zinc-900 font-bold sticky top-0 z-10 shadow-sm border-b px-6">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] tracking-wider"
                    onClick={() => handleSort("created_at")}
                  >
                    Timestamp
                    {sortConfig?.key === "created_at" ? (
                      sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[150px] bg-zinc-50 text-zinc-900 font-bold sticky top-0 z-10 shadow-sm border-b px-6">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] tracking-wider"
                    onClick={() => handleSort("action")}
                  >
                    Action
                    {sortConfig?.key === "action" ? (
                      sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[120px] bg-zinc-50 text-zinc-900 font-bold sticky top-0 z-10 shadow-sm border-b px-6">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] tracking-wider"
                    onClick={() => handleSort("module")}
                  >
                    Module
                    {sortConfig?.key === "module" ? (
                      sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[200px] bg-zinc-50 text-zinc-900 font-bold sticky top-0 z-10 shadow-sm border-b uppercase text-[10px] tracking-wider px-6">
                  User Account
                </TableHead>
                <TableHead className="bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm border-b px-6">
                  Activity Description
                </TableHead>
                <TableHead className="w-[80px] text-right bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm border-b px-8">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableSkeleton columnCount={6} rowCount={10} />
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="text-red-600 font-bold text-sm mb-2 uppercase tracking-tight">
                      Communication Error
                    </div>
                    <div className="text-xs text-zinc-500 font-medium mb-4">
                      {error}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-bold text-[10px] uppercase border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => fetchLogs(pagination.page, searchTerm)}
                    >
                      Retry Connection
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-24 text-zinc-400 font-bold uppercase text-[10px] tracking-widest"
                  >
                    No activity records found matching criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="group hover:bg-zinc-50/50 transition-colors"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-bold text-zinc-900">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                          {format(new Date(log.created_at), "dd MMM yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                          getActionColor(log.action)
                        )}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className="text-[9px] uppercase font-black tracking-widest bg-zinc-100 text-zinc-500 border-none shadow-none"
                      >
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 shrink-0">
                          <User className="h-3 w-3 text-zinc-400" />
                        </div>
                        <div className="text-xs font-bold text-zinc-600 truncate max-w-[150px]">
                          {log.users?.email || "SYSTEM_PROCESS"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm font-medium text-zinc-700 line-clamp-1 group-hover:line-clamp-none transition-all">
                        {log.description}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-zinc-200/50"
                            onClick={() => setSelectedLog(log)}
                          >
                            <SearchCode className="h-3.5 w-3.5 text-zinc-400 group-hover:text-red-600 transition-colors" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white border-zinc-200">
                          <DialogHeader className="border-b pb-4">
                            <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight uppercase">
                              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                                <HistoryIcon className="h-5 w-5 text-white" />
                              </div>
                              Audit Event Profile
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 py-6">
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                  SYSTEM TIMESTAMP
                                </span>
                                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs font-bold text-zinc-700 flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-zinc-400" />{" "}
                                  {new Date(log.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                  ACTION CLASSIFICATION
                                </span>
                                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs font-bold flex items-center gap-2">
                                  <Badge
                                    className={cn(
                                      "text-[9px] font-black uppercase shadow-none border-none",
                                      getActionColor(log.action)
                                    )}
                                  >
                                    {log.action}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                  MODULE ORIGIN
                                </span>
                                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs font-bold text-zinc-700">
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] font-black uppercase bg-zinc-200 text-zinc-600 border-none shadow-none"
                                  >
                                    {log.module}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                  ACTOR CREDENTIALS
                                </span>
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2">
                                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                                    <User className="h-4 w-4 text-red-600" />
                                    {log.users?.email || "SYSTEM_PROCESS"}
                                  </div>
                                  <div className="text-[9px] font-mono text-zinc-400 truncate">
                                    ID:{" "}
                                    {log.user_id ||
                                      "75475357-5353-5355-535F-534352495054"}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                  NETWORK ORIGIN
                                </span>
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2">
                                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                                    <Monitor className="h-4 w-4 text-blue-600" />
                                    {log.ip_address || "INTERNAL_PROCESS"}
                                  </div>
                                  <div className="text-[9px] font-mono text-zinc-400 truncate">
                                    {log.device_info
                                      ? log.device_info.substring(0, 40) + "..."
                                      : "CORE_INFRASTRUCTURE"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                RAW METADATA PAYLOAD
                              </span>
                              <pre className="p-6 bg-zinc-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-auto max-h-[250px] shadow-inner border border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                          <div className="flex justify-end pt-4 border-t">
                            <Button
                              variant="ghost"
                              className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900"
                              onClick={() => {}}
                            >
                              Export Event JSON
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
