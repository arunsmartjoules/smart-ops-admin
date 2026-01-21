"use client";

import { useState, useEffect, useRef } from "react";
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
  Ticket,
  Filter,
  Eye,
  Building2,
  User,
  Phone,
  Thermometer,
  Trash2,
  Edit,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_VARIANTS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700 border-blue-200",
  Inprogress: "bg-orange-100 text-orange-700 border-orange-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
  Hold: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Waiting: "bg-purple-100 text-purple-700 border-purple-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
};

const ALL_COLUMNS = [
  { key: "ticket_no", label: "Ticket #" },
  { key: "ticket_id", label: "Ticket ID" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "category", label: "Category" },
  { key: "site_id", label: "Site" },
  { key: "location", label: "Location" },
  { key: "area_asset", label: "Area/Asset" },
  { key: "assigned_to", label: "Assigned To" },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_number", label: "Contact Phone" },
  { key: "current_temperature", label: "Temp (°C)" },
  { key: "current_rh", label: "RH (%)" },
  { key: "standard_temperature", label: "Std Temp" },
  { key: "standard_rh", label: "Std RH" },
  { key: "created_user", label: "Created By" },
  { key: "message_id", label: "Message ID" },
  { key: "sender_id", label: "Sender ID" },
  { key: "spare_type", label: "Spare Type" },
  { key: "spare_quantity", label: "Spare Qty" },
  { key: "escalation_source", label: "Escalation" },
  { key: "sub_ticket_id", label: "Sub Ticket" },
  { key: "start_datetime", label: "Start Date" },
  { key: "end_datetime", label: "End Date" },
  { key: "responded_at", label: "Responded" },
  { key: "resolved_at", label: "Resolved" },
  { key: "flag_incident", label: "Incident?" },
  { key: "reason", label: "Reason" },
  { key: "support_users", label: "Support Users" },
  { key: "group_id", label: "Group ID" },
  { key: "support_users_name", label: "Support Names" },
  { key: "internal_remarks", label: "Internal Remarks" },
  { key: "customer_inputs", label: "Customer Input" },
  { key: "notes", label: "Notes" },
  { key: "attachments", label: "Attachments" },
  { key: "created_at", label: "Created At" },
  { key: "updated_at", label: "Updated At" },
];

const DEFAULT_VISIBLE = new Set([
  "ticket_no",
  "title",
  "status",
  "category",
  "assigned_to",
  "area_asset",
  "created_at",
]);

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    status: "",
    assigned_to: "",
    internal_remarks: "",
  });
  const [visibleColumns, setVisibleColumns] =
    useState<Set<string>>(DEFAULT_VISIBLE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleColumn = (key: string) => {
    const next = new Set(visibleColumns);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleColumns(next);
  };

  // Filters
  const [siteId, setSiteId] = useState("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchSites();
    fetchTickets();
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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
        status: status !== "all" ? status : "",
        category: category !== "all" ? category : "",
        fromDate: dateFrom.toISOString().split("T")[0],
        toDate: dateTo.toISOString().split("T")[0],
      });

      const res = await apiFetch(
        `/api/complaints/site/${siteId}?${params.toString()}`,
      );
      const result = await safeJsonParse(res);

      if (result.success) {
        setTickets(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchTickets();
    setFilterOpen(false);
  };

  const exportToCSV = () => {
    if (tickets.length === 0) return;

    const headers = ALL_COLUMNS.map((c) => c.label);
    const csvContent = [
      headers.join(","),
      ...tickets.map((t) =>
        ALL_COLUMNS.map((col) => {
          const val = t[col.key];
          if (val === null || val === undefined) return "";
          if (col.key.includes("date") || col.key.includes("_at")) {
            return format(new Date(val), "yyyy-MM-dd HH:mm");
          }
          return val.toString();
        })
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tickets_full_report_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticket_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.site_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, siteId, status, category, dateFrom, dateTo]);

  // Selection helpers
  const toggleSelection = (ticketId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(
      new Set(paginatedTickets.map((t) => t.ticket_id || t.ticket_no)),
    );
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected =
    selectedIds.size > 0 &&
    paginatedTickets.length > 0 &&
    paginatedTickets.every((t) => selectedIds.has(t.ticket_id || t.ticket_no));

  // Bulk actions
  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      // DELETE requests for selected tickets
      const deletePromises = Array.from(selectedIds).map((id) =>
        apiFetch(`/api/complaints/${id}`, { method: "DELETE" }),
      );

      await Promise.all(deletePromises);

      // Refresh tickets
      await fetchTickets();
      clearSelection();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete tickets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEditAction = async () => {
    try {
      setBulkEditLoading(true);

      const payload: any = {};
      if (bulkEditData.status) payload.status = bulkEditData.status;
      if (bulkEditData.assigned_to)
        payload.assigned_to = bulkEditData.assigned_to;
      if (bulkEditData.internal_remarks)
        payload.internal_remarks = bulkEditData.internal_remarks;

      if (Object.keys(payload).length === 0) {
        setBulkEditOpen(false);
        return;
      }

      const updatePromises = Array.from(selectedIds).map((id) =>
        apiFetch(`/api/complaints/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      );

      await Promise.all(updatePromises);
      await fetchTickets();
      clearSelection();
      setBulkEditOpen(false);
      setBulkEditData({ status: "", assigned_to: "", internal_remarks: "" });
    } catch (error) {
      console.error("Failed to bulk edit tickets", error);
      alert("Failed to update tickets");
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleBulkEdit = () => {
    setBulkEditOpen(true);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");

      // Parse CSV and create tickets
      const newTickets = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line
            .split(",")
            .map((v) => v.replace(/^"|"$/g, "").trim());
          const ticket: any = {};
          headers.forEach((header, index) => {
            const key = header.trim().toLowerCase().replace(/\s+/g, "_");
            ticket[key] = values[index] || "";
          });
          return ticket;
        });

      // TODO: Send to backend
      console.log("Parsed tickets:", newTickets);
      alert(
        `Parsed ${newTickets.length} tickets. Backend integration pending.`,
      );
      setImportOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 sm:p-6 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Ticket className="h-8 w-8 text-red-600" />
            Tickets Management
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Manage, filter and export service requests and complaints across all
            sites.
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
                  Filter Tickets
                </SheetTitle>
                <SheetDescription>
                  Apply filters to narrow down your ticket search
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Building2 size={12} /> Site
                  </label>
                  <Select value={siteId} onValueChange={setSiteId}>
                    <SelectTrigger className="w-full bg-white border-zinc-200">
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {sites.map((site) => (
                        <SelectItem
                          key={site.site_id}
                          value={site.site_code || site.site_id}
                        >
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Filter size={12} /> Status
                  </label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full bg-white border-zinc-200">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Inprogress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Hold">Hold</SelectItem>
                      <SelectItem value="Waiting">Waiting</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Ticket size={12} /> Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full bg-white border-zinc-200">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Complaint">Complaint</SelectItem>
                      <SelectItem value="Service Request">
                        Service Request
                      </SelectItem>
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
            onClick={() => setImportOpen(true)}
            className="border-zinc-300 hover:bg-zinc-100 transition-all font-medium"
          >
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>

          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={loading || tickets.length === 0}
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
            <DropdownMenuContent className="w-56 max-h-[80vh] overflow-y-auto z-100">
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
              onClick={handleBulkEdit}
              className="text-white hover:bg-red-700 h-8"
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
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
          placeholder="Search by ticket number, title, site, contact, or assignee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-white border-zinc-200 focus:bg-white transition-all"
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
                <TableHead className="w-[80px] font-bold text-zinc-900 uppercase text-[10px] tracking-widest text-center sticky right-0 bg-zinc-50 z-20 border-l">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columnCount={11} rowCount={10} />
              ) : paginatedTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-80 text-center text-zinc-400 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <FileText className="h-12 w-12" />
                      <p className="text-sm">
                        No tickets found for current filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTickets.map((ticket, index) => (
                  <TableRow
                    key={
                      ticket.ticket_id || ticket.ticket_no || `ticket-${index}`
                    }
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group border-b border-zinc-100",
                      selectedIds.has(ticket.ticket_id || ticket.ticket_no) &&
                        "bg-red-50/30",
                    )}
                  >
                    <TableCell className="sticky left-0 bg-white group-hover:bg-zinc-50 z-10 border-r text-center px-4">
                      <Checkbox
                        checked={selectedIds.has(
                          ticket.ticket_id || ticket.ticket_no,
                        )}
                        onCheckedChange={() =>
                          toggleSelection(ticket.ticket_id || ticket.ticket_no)
                        }
                      />
                    </TableCell>
                    {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                      (col) => (
                        <TableCell key={col.key} className="px-4 py-3">
                          {col.key === "status" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md border",
                                STATUS_VARIANTS[ticket.status] ||
                                  "bg-zinc-100 text-zinc-600 border-zinc-200",
                              )}
                            >
                              {ticket.status}
                            </Badge>
                          ) : col.key === "ticket_no" ? (
                            <span className="font-mono font-bold text-red-600 text-[11px] tracking-tighter whitespace-nowrap">
                              #{ticket.ticket_no || ticket.id?.slice(0, 8)}
                            </span>
                          ) : col.key === "title" ? (
                            <div className="flex flex-col max-w-[250px]">
                              <span className="font-bold text-zinc-900 text-sm line-clamp-1 group-hover:text-red-600 transition-colors">
                                {ticket.title}
                              </span>
                              {visibleColumns.has("site_id") === false && (
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                  {ticket.site_id}
                                </span>
                              )}
                            </div>
                          ) : col.key === "category" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold uppercase px-2 bg-zinc-100 text-zinc-500 border-none"
                            >
                              {ticket.category}
                            </Badge>
                          ) : col.key === "assigned_to" ? (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <User size={12} className="text-zinc-400" />
                              <span className="text-xs text-zinc-700 font-medium">
                                {ticket.assigned_to || "Unassigned"}
                              </span>
                            </div>
                          ) : col.key.includes("date") ||
                            col.key.includes("_at") ||
                            col.key.includes("datetime") ||
                            col.key === "responded_at" ||
                            col.key === "resolved_at" ? (
                            <span className="text-[11px] text-zinc-500 font-medium whitespace-nowrap">
                              {ticket[col.key]
                                ? format(
                                    new Date(ticket[col.key]),
                                    "MMM dd, HH:mm",
                                  )
                                : "-"}
                            </span>
                          ) : col.key === "current_temperature" ||
                            col.key === "current_rh" ||
                            col.key === "standard_temperature" ||
                            col.key === "standard_rh" ? (
                            <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">
                              {ticket[col.key] !== null &&
                              ticket[col.key] !== undefined
                                ? `${ticket[col.key]}${
                                    col.key.includes("temp") ? "°C" : "%"
                                  }`
                                : "-"}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] block">
                              {ticket[col.key]?.toString() || "-"}
                            </span>
                          )}
                        </TableCell>
                      ),
                    )}
                    <TableCell className="text-center sticky right-0 bg-white group-hover:bg-zinc-50 z-10 border-l shadow-[-10px_0_15px_rgba(0,0,0,0.02)] px-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
                          <DialogHeader className="p-6 bg-zinc-900 text-white shrink-0">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                              <Ticket className="h-5 w-5 text-red-500" />
                              Ticket Details
                              <span className="ml-auto text-[10px] font-mono tracking-wider opacity-50">
                                {ticket.ticket_no}
                              </span>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto">
                            <div className="p-8 space-y-6">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Status
                                  </label>
                                  <Badge
                                    className={cn(
                                      "px-3 py-1 font-bold rounded-lg border",
                                      STATUS_VARIANTS[ticket.status] ||
                                        "bg-zinc-100 text-zinc-600",
                                    )}
                                  >
                                    {ticket.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Category
                                  </label>
                                  <p className="text-sm font-bold text-zinc-900 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                    {ticket.category}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Area/Asset
                                  </label>
                                  <p className="text-sm font-bold text-zinc-900 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                                    {ticket.area_asset || "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                  Issue Description
                                </label>
                                <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
                                  <h4 className="font-bold text-zinc-900 mb-2">
                                    {ticket.title}
                                  </h4>
                                  <p className="text-sm text-zinc-600 leading-relaxed">
                                    {ticket.customer_inputs ||
                                      "No description provided."}
                                  </p>
                                </div>
                              </div>

                              {ticket.internal_remarks && (
                                <div className="space-y-1.5 bg-red-50/50 border border-red-100 p-4 rounded-xl">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">
                                    Internal Remarks
                                  </label>
                                  <p className="text-sm text-red-900 font-medium">
                                    {ticket.internal_remarks}
                                  </p>
                                </div>
                              )}

                              {ticket.notes && (
                                <div className="space-y-1.5 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1">
                                    Notes
                                  </label>
                                  <p className="text-sm text-blue-900 font-medium">
                                    {ticket.notes}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Assigned To
                                  </label>
                                  <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                                    <User size={14} className="text-zinc-400" />
                                    {ticket.assigned_to || "Unassigned"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Created By
                                  </label>
                                  <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                                    <User size={14} className="text-zinc-400" />
                                    {ticket.created_user || "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Contact Person
                                  </label>
                                  <p className="text-sm font-bold text-zinc-800">
                                    {ticket.contact_name || "-"}
                                  </p>
                                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Phone size={12} />
                                    {ticket.contact_number || "-"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Site Location
                                  </label>
                                  <p className="text-sm font-bold text-zinc-800">
                                    {ticket.site_id}
                                  </p>
                                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    <MapPin size={12} />
                                    {ticket.location}
                                  </p>
                                </div>
                              </div>

                              {(ticket.current_temperature ||
                                ticket.current_rh) && (
                                <div className="grid grid-cols-2 gap-6 bg-orange-50/50 border border-orange-100 p-4 rounded-xl">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                      Current Conditions
                                    </label>
                                    <p className="text-sm font-bold text-orange-900">
                                      Temp: {ticket.current_temperature || "-"}
                                      °C | RH: {ticket.current_rh || "-"}%
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                      Standard Conditions
                                    </label>
                                    <p className="text-sm font-bold text-orange-900">
                                      Temp: {ticket.standard_temperature || "-"}
                                      °C | RH: {ticket.standard_rh || "-"}%
                                    </p>
                                  </div>
                                </div>
                              )}

                              {(ticket.spare_type || ticket.spare_quantity) && (
                                <div className="space-y-1 bg-purple-50/50 border border-purple-100 p-4 rounded-xl">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-purple-600 block mb-1">
                                    Spare Parts
                                  </label>
                                  <p className="text-sm font-bold text-purple-900">
                                    {ticket.spare_type}{" "}
                                    {ticket.spare_quantity &&
                                      `(Qty: ${ticket.spare_quantity})`}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-6 border-t border-zinc-100 pt-6">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Created At
                                  </label>
                                  <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                                    <CalendarIcon
                                      size={14}
                                      className="text-zinc-400"
                                    />
                                    {ticket.created_at
                                      ? format(
                                          new Date(ticket.created_at),
                                          "PPP p",
                                        )
                                      : "-"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Last Updated
                                  </label>
                                  <p className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                                    <Clock
                                      size={14}
                                      className="text-zinc-400"
                                    />
                                    {ticket.updated_at
                                      ? format(
                                          new Date(ticket.updated_at),
                                          "PPP p",
                                        )
                                      : "-"}
                                  </p>
                                </div>
                              </div>

                              {(ticket.resolved_at || ticket.closed_at) && (
                                <div className="grid grid-cols-2 gap-6">
                                  {ticket.resolved_at && (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-green-600">
                                        Resolved At
                                      </label>
                                      <p className="text-sm font-bold text-green-800">
                                        {format(
                                          new Date(ticket.resolved_at),
                                          "PPP p",
                                        )}
                                      </p>
                                    </div>
                                  )}
                                  {ticket.closed_at && (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                        Closed At
                                      </label>
                                      <p className="text-sm font-bold text-zinc-800">
                                        {format(
                                          new Date(ticket.closed_at),
                                          "PPP p",
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
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

        {/* Pagination Controls */}
        {!loading && filteredTickets.length > 0 && (
          <div className="border-t border-zinc-200 bg-zinc-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-sm text-zinc-600">
                  Showing{" "}
                  <span className="font-semibold text-zinc-900">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-zinc-900">
                    {Math.min(endIndex, filteredTickets.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-zinc-900">
                    {filteredTickets.length}
                  </span>{" "}
                  tickets
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600">Per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px] bg-white border-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-zinc-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 7) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 4) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNumber = totalPages - 6 + i;
                    } else {
                      pageNumber = currentPage - 3 + i;
                    }

                    if (pageNumber < 1 || pageNumber > totalPages) return null;

                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          currentPage === pageNumber ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={cn(
                          "h-8 w-8 p-0 border-zinc-300",
                          currentPage === pageNumber &&
                            "bg-red-600 hover:bg-red-700 text-white border-red-600",
                        )}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-zinc-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import CSV Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-red-600" />
              Import Tickets from CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-600">
              Upload a CSV file to import tickets. The first row should contain
              column headers matching the ticket fields.
            </p>
            <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center hover:border-red-600 transition-colors cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-3 text-zinc-400" />
                <p className="font-semibold text-zinc-700">
                  Click to upload CSV
                </p>
                <p className="text-xs text-zinc-500 mt-1">or drag and drop</p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete {selectedIds.size} Ticket{selectedIds.size > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected tickets from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-red-600" />
              Bulk Edit {selectedIds.size} Tickets
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">Update Status</Label>
              <Select
                value={bulkEditData.status}
                onValueChange={(val) =>
                  setBulkEditData({ ...bulkEditData, status: val })
                }
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue placeholder="Keep current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Inprogress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                  <SelectItem value="Waiting">Waiting</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-assignee">Update Assignee</Label>
              <Input
                id="bulk-assignee"
                value={bulkEditData.assigned_to}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBulkEditData({
                    ...bulkEditData,
                    assigned_to: e.target.value,
                  })
                }
                placeholder="Enter assignee name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-remarks">Internal Remarks</Label>
              <Textarea
                id="bulk-remarks"
                value={bulkEditData.internal_remarks}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBulkEditData({
                    ...bulkEditData,
                    internal_remarks: e.target.value,
                  })
                }
                placeholder="Enter internal remarks..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkEditAction}
              disabled={bulkEditLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkEditLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
