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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  Calendar as CalendarIcon,
  MapPin,
  FileText,
  Loader2,
  Clock,
} from "lucide-react";
import { apiFetch, safeJsonParse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";

export default function AttendanceReportPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [siteId, setSiteId] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  );
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSites();
    fetchReport();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await apiFetch("/api/sites");
      const result = await safeJsonParse(res);
      if (result.success) {
        setSites(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch sites", error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date_from: dateFrom.toISOString().split("T")[0],
        date_to: dateTo.toISOString().split("T")[0],
        site_id: siteId,
      });
      const res = await apiFetch(
        `/api/attendance/overall-report?${params.toString()}`,
      );
      const result = await safeJsonParse(res);
      if (result.success) {
        setReportData(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch report", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchReport();
  };

  const exportToCSV = () => {
    if (reportData.length === 0) return;

    const headers = [
      "Date",
      "Employee Name",
      "Employee Code",
      "Site",
      "Check-In Time",
      "Check-In Lat",
      "Check-In Long",
      "Check-Out Time",
      "Check-Out Lat",
      "Check-Out Long",
      "Status",
      "Remarks",
    ];

    const csvContent = [
      headers.join(","),
      ...reportData.map((log) =>
        [
          log.date,
          log.users?.name,
          log.users?.employee_code,
          log.sites?.name,
          log.check_in_time
            ? new Date(log.check_in_time).toLocaleTimeString()
            : "-",
          log.check_in_latitude || "-",
          log.check_in_longitude || "-",
          log.check_out_time
            ? new Date(log.check_out_time).toLocaleTimeString()
            : "-",
          log.check_out_latitude || "-",
          log.check_out_longitude || "-",
          log.status,
          log.remarks,
        ]
          .map((v) => `"${v || ""}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `attendance_report_${format(dateFrom, "yyyy-MM-dd")}_to_${format(
        dateTo,
        "yyyy-MM-dd",
      )}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = reportData.filter(
    (log) =>
      log.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.users?.employee_code
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      log.sites?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-700 border-green-200";
      case "absent":
        return "bg-red-100 text-red-700 border-red-200";
      case "half day":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "leave":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 sm:p-6 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Attendance Logs
          </h1>
          <p className="text-zinc-500 mt-1">
            Detailed daily attendance with location verification.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={loading || reportData.length === 0}
          className="border-zinc-300 hover:bg-zinc-100 transition-all font-medium"
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters Area */}
      <Card className="border-zinc-200 shadow-sm overflow-visible">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <MapPin size={12} /> Select Site
              </label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger className="w-full bg-white border-zinc-200">
                  <SelectValue placeholder="All Sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.site_id} value={site.site_id}>
                      {site.name} ({site.site_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <CalendarIcon size={12} /> From
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border-zinc-200",
                      !dateFrom && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? (
                      format(dateFrom, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <CalendarIcon size={12} /> To
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border-zinc-200",
                      !dateTo && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply Filters"
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search name, code, or site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-zinc-50/50 border-zinc-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-zinc-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[100px] font-bold text-zinc-900 uppercase text-[10px] tracking-wider">
                  Date
                </TableHead>
                <TableHead className="w-[180px] font-bold text-zinc-900 uppercase text-[10px] tracking-wider">
                  Employee
                </TableHead>
                <TableHead className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider">
                  Site
                </TableHead>
                <TableHead className="w-[140px] font-bold text-zinc-900 uppercase text-[10px] tracking-wider">
                  Check-In
                </TableHead>
                <TableHead className="w-[140px] font-bold text-zinc-900 uppercase text-[10px] tracking-wider">
                  Check-Out
                </TableHead>
                <TableHead className="w-[100px] font-bold text-zinc-900 uppercase text-[10px] tracking-wider">
                  Status
                </TableHead>
                <TableHead className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider">
                  Remarks
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columnCount={7} rowCount={10} />
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-64 text-center text-muted-foreground font-medium"
                  >
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <TableCell className="font-medium text-zinc-900 whitespace-nowrap text-xs">
                      {log.date}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 text-sm">
                          {log.users?.name || "Unknown"}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 capitalize">
                          {log.users?.employee_code || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600 text-sm font-medium">
                      {log.sites?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
                          <Clock size={12} className="text-zinc-400" />
                          {log.check_in_time
                            ? new Date(log.check_in_time).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "-"}
                        </div>
                        {log.check_in_latitude && (
                          <button
                            onClick={() =>
                              openInGoogleMaps(
                                log.check_in_latitude,
                                log.check_in_longitude,
                              )
                            }
                            className="flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700 font-bold uppercase tracking-tight"
                          >
                            <MapPin size={10} /> View Map
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
                          <Clock size={12} className="text-zinc-400" />
                          {log.check_out_time
                            ? new Date(log.check_out_time).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "-"}
                        </div>
                        {log.check_out_latitude && (
                          <button
                            onClick={() =>
                              openInGoogleMaps(
                                log.check_out_latitude,
                                log.check_out_longitude,
                              )
                            }
                            className="flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700 font-bold uppercase tracking-tight"
                          >
                            <MapPin size={10} /> View Map
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-wider ${getStatusColor(
                          log.status,
                        )}`}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 max-w-[150px] truncate italic text-xs">
                      {log.remarks || "-"}
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
