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
  ListFilter,
  Users,
  Filter,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ALL_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "employee", label: "Employee" },
  { key: "site", label: "Site" },
  { key: "check_in", label: "Check-In" },
  { key: "check_out", label: "Check-Out" },
  { key: "status", label: "Status" },
  { key: "remarks", label: "Remarks" },
];

const DEFAULT_VISIBLE = new Set([
  "date",
  "employee",
  "site",
  "check_in",
  "check_out",
  "status",
]);

export default function AttendanceReportPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] =
    useState<Set<string>>(DEFAULT_VISIBLE);

  // Filters
  const [siteId, setSiteId] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  );
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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

  const handleApplyFilters = () => {
    fetchReport();
    setFilterOpen(false);
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Selection helpers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(paginatedData.map((log) => log.id || log.log_id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((log) => selectedIds.has(log.id || log.log_id));

  const toggleColumn = (key: string) => {
    const next = new Set(visibleColumns);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleColumns(next);
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const deletePromises = Array.from(selectedIds).map((id) =>
        apiFetch(`/api/attendance/${id}`, { method: "DELETE" }),
      );
      await Promise.all(deletePromises);
      await fetchReport();
      clearSelection();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete attendance logs", error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-red-600" />
            Attendance Logs
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Manage and export detailed daily attendance with location
            verification.
          </p>
        </div>
        <div className="flex gap-3">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="border-zinc-300 hover:bg-zinc-100 font-medium"
              >
                <Filter className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Attendance
                </SheetTitle>
                <SheetDescription>
                  Apply filters to narrow down your attendance search
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <MapPin size={12} /> Site
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
                    <CalendarIcon size={12} /> Date From
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
                    <CalendarIcon size={12} /> Date To
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
                        {dateTo ? (
                          format(dateTo, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
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

                <div className="pt-4 border-t border-zinc-200">
                  <Button
                    onClick={handleApplyFilters}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 shadow-sm font-bold"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Filter className="h-4 w-4 mr-2" />
                    )}
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={loading || reportData.length === 0}
            className="border-zinc-300 hover:bg-zinc-100 transition-all font-medium"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-zinc-300 hover:bg-zinc-100 font-medium"
              >
                <Eye className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 overflow-y-auto">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="font-bold">{selectedIds.size} Selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-white hover:bg-red-700 h-8"
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-white hover:bg-red-800 h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search by name, code, or site..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-white border-zinc-200 focus:bg-white transition-all shadow-sm"
        />
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-zinc-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-zinc-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px] font-bold text-zinc-900 uppercase text-[10px] tracking-widest bg-zinc-50 sticky left-0 z-20 border-r">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAll();
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                </TableHead>
                {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                  (col) => (
                    <TableHead
                      key={col.key}
                      className="font-bold text-zinc-900 uppercase text-[10px] tracking-widest whitespace-nowrap px-4"
                    >
                      {col.label}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton
                  columnCount={visibleColumns.size + 1}
                  rowCount={10}
                />
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.size + 1}
                    className="h-80 text-center text-zinc-400 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <FileText className="h-12 w-12" />
                      <p className="text-sm">
                        No logs found for current filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((log, index) => (
                  <TableRow
                    key={log.id || log.log_id || `log-${index}`}
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group border-b border-zinc-100",
                      selectedIds.has(log.id || log.log_id) && "bg-red-50/30",
                    )}
                  >
                    <TableCell className="sticky left-0 bg-white group-hover:bg-zinc-50 z-10 border-r text-center px-4">
                      <Checkbox
                        checked={selectedIds.has(log.id || log.log_id)}
                        onCheckedChange={() =>
                          toggleSelection(log.id || log.log_id)
                        }
                      />
                    </TableCell>
                    {visibleColumns.has("date") && (
                      <TableCell className="font-medium text-zinc-900 whitespace-nowrap text-xs px-4">
                        {log.date}
                      </TableCell>
                    )}
                    {visibleColumns.has("employee") && (
                      <TableCell className="px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 text-sm">
                            {log.users?.name || "Unknown"}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 capitalize">
                            {log.users?.employee_code || "-"}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has("site") && (
                      <TableCell className="text-zinc-600 text-sm font-medium px-4">
                        {log.sites?.name || "-"}
                      </TableCell>
                    )}
                    {visibleColumns.has("check_in") && (
                      <TableCell className="px-4">
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
                    )}
                    {visibleColumns.has("check_out") && (
                      <TableCell className="px-4">
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
                    )}
                    {visibleColumns.has("status") && (
                      <TableCell className="px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md border",
                            getStatusColor(log.status),
                          )}
                        >
                          {log.status || "Unknown"}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.has("remarks") && (
                      <TableCell className="text-zinc-500 max-w-[150px] truncate italic text-xs px-4">
                        {log.remarks || "-"}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => setItemsPerPage(parseInt(v))}
              >
                <SelectTrigger className="h-8 w-16 bg-white border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((v) => (
                    <SelectItem key={v} value={v.toString()}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="h-4 w-px bg-zinc-200" />
            <p>
              Showing{" "}
              <span className="font-bold text-zinc-900">{startIndex + 1}</span>{" "}
              to{" "}
              <span className="font-bold text-zinc-900">
                {Math.min(endIndex, filteredData.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-zinc-900">
                {filteredData.length}
              </span>{" "}
              logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2),
                )
                .map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-xs font-bold",
                      currentPage === pageNum
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "text-zinc-600",
                    )}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} attendance
              records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
