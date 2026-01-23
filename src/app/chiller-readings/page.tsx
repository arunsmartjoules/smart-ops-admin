"use client";

import { useState, useEffect, useMemo } from "react";
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
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Thermometer,
  Eye,
  Gauge,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, safeJsonParse } from "@/lib/api";
import { TableSkeleton } from "@/components/table-skeleton";
import { cn } from "@/lib/utils";

const ALL_COLUMNS = [
  { key: "log_id", label: "Log ID", default: true },
  { key: "site_id", label: "Site ID", default: true },
  { key: "chiller_id", label: "Chiller ID", default: true },
  { key: "equipment_id", label: "Equipment ID", default: false },
  { key: "date_shift", label: "Date/Shift", default: true },
  { key: "reading_time", label: "Reading Time", default: true },
  { key: "condenser_inlet_temp", label: "Cond. Inlet (°C)", default: true },
  { key: "condenser_outlet_temp", label: "Cond. Outlet (°C)", default: true },
  { key: "evaporator_inlet_temp", label: "Evap. Inlet (°C)", default: false },
  { key: "evaporator_outlet_temp", label: "Evap. Outlet (°C)", default: false },
  {
    key: "compressor_suction_temp",
    label: "Suction Temp (°C)",
    default: false,
  },
  { key: "motor_temperature", label: "Motor Temp (°C)", default: false },
  { key: "saturated_condenser_temp", label: "Sat. Cond. (°C)", default: false },
  { key: "saturated_suction_temp", label: "Sat. Suction (°C)", default: false },
  { key: "discharge_pressure", label: "Discharge Press.", default: true },
  { key: "main_suction_pressure", label: "Suction Press.", default: true },
  { key: "oil_pressure", label: "Oil Press.", default: false },
  { key: "oil_pressure_difference", label: "Oil Press. Diff.", default: false },
  { key: "condenser_inlet_pressure", label: "Cond. In Press.", default: false },
  {
    key: "condenser_outlet_pressure",
    label: "Cond. Out Press.",
    default: false,
  },
  {
    key: "evaporator_inlet_pressure",
    label: "Evap. In Press.",
    default: false,
  },
  {
    key: "evaporator_outlet_pressure",
    label: "Evap. Out Press.",
    default: false,
  },
  { key: "compressor_load_percent", label: "Load (%)", default: true },
  { key: "inline_btu_meter", label: "BTU Meter", default: false },
  { key: "set_point", label: "Set Point", default: false },
  { key: "sla_status", label: "SLA Status", default: true },
  { key: "executor_id", label: "Executor", default: true },
  { key: "reviewed_by", label: "Reviewed By", default: false },
  { key: "remarks", label: "Remarks", default: true },
  { key: "created_at", label: "Created At", default: true },
];

export default function ChillerReadingsPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter((c) => c.default).map((c) => c.key)),
  );
  const [siteFilter, setSiteFilter] = useState<string>("all");

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReadings(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchReadings = async (search: string = "") => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/chiller-readings${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      );
      const result = await safeJsonParse(res);
      if (result.success) {
        setReadings(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch readings", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReadings = useMemo(() => {
    let result = [...readings];

    if (siteFilter !== "all") {
      result = result.filter((r) => r.site_id === siteFilter);
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [readings, sortConfig, siteFilter]);

  const sites = useMemo(() => {
    const siteSet = new Set(readings.map((r) => r.site_id).filter(Boolean));
    return Array.from(siteSet);
  }, [readings]);

  const exportToCSV = () => {
    if (readings.length === 0) return;

    const headers = ALL_COLUMNS.map((c) => c.label);
    const csvContent = [
      headers.join(","),
      ...readings.map((r) =>
        ALL_COLUMNS.map((col) =>
          `"${r[col.key] || ""}"`.replace(/\n/g, " "),
        ).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `chiller_readings_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredReadings.map((r) => r.log_id || r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reading?")) return;
    try {
      const res = await apiFetch(`/api/chiller-readings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchReadings();
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const toggleColumn = (key: string) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setVisibleColumns(newSet);
  };

  const formatNumber = (val: any) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = parseFloat(val);
    return isNaN(num) ? "-" : num.toFixed(2);
  };

  const SortableHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: string;
  }) => (
    <TableHead className="bg-zinc-50 sticky top-0 z-20 shadow-sm border-b whitespace-nowrap">
      <button
        className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
        onClick={() => handleSort(sortKey)}
      >
        {label}
        {sortConfig?.key === sortKey ? (
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
  );

  return (
    <div className="flex flex-col h-full space-y-4 p-4 sm:p-6 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Chiller Readings
          </h1>
          <p className="text-zinc-500 mt-1">
            Monitor and track chiller performance metrics and readings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={loading || readings.length === 0}
            className="border-zinc-300 hover:bg-zinc-100"
          >
            <Download className="mr-2 h-4 w-4 text-zinc-500" /> Export CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-zinc-300">
                <Eye className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
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

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20">
                <Plus className="mr-2 h-4 w-4" /> Add Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Chiller Reading</DialogTitle>
              </DialogHeader>
              <ReadingForm
                onSave={() => {
                  setIsAddOpen(false);
                  fetchReadings();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by site, chiller, log ID..."
              className="pl-10 bg-zinc-50 border-zinc-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site} value={site}>
                  {site}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <span>
            Showing{" "}
            <span className="text-zinc-900">{filteredReadings.length}</span> of{" "}
            <span className="text-zinc-900">{readings.length}</span> readings
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table className="border-separate border-spacing-0">
            <TableHeader className="bg-zinc-50 sticky top-0 z-30">
              <TableRow>
                <TableHead className="w-[48px] bg-zinc-50/80 backdrop-blur sticky top-0 left-0 z-40 shadow-sm border-b px-4">
                  <Checkbox
                    checked={
                      filteredReadings.length > 0 &&
                      selectedIds.length === filteredReadings.length
                    }
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                  />
                </TableHead>
                {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                  (col) => (
                    <SortableHeader
                      key={col.key}
                      label={col.label}
                      sortKey={col.key}
                    />
                  ),
                )}
                <TableHead className="min-w-[80px] bg-zinc-50 text-right sticky right-0 top-0 z-30 shadow-sm border-b border-l uppercase text-[10px] font-bold tracking-wider text-zinc-900 px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableSkeleton
                  columnCount={visibleColumns.size + 2}
                  rowCount={10}
                />
              ) : filteredReadings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.size + 2}
                    className="text-center py-20 text-muted-foreground font-medium"
                  >
                    No chiller readings found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReadings.map((item) => (
                  <TableRow
                    key={item.log_id || item.id}
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group",
                      selectedIds.includes(item.log_id || item.id)
                        ? "bg-red-50/30"
                        : "",
                    )}
                  >
                    <TableCell className="px-4 sticky left-0 z-10 bg-white group-hover:bg-zinc-50 transition-colors border-r border-zinc-100">
                      <Checkbox
                        checked={selectedIds.includes(item.log_id || item.id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(item.log_id || item.id, !!checked)
                        }
                      />
                    </TableCell>
                    {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                      (col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            "text-xs font-mono",
                            col.key === "log_id" || col.key === "chiller_id"
                              ? "font-bold text-zinc-900"
                              : "text-zinc-600",
                          )}
                        >
                          {col.key === "sla_status" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                                item.sla_status === "Met"
                                  ? "text-green-600 bg-green-50"
                                  : item.sla_status === "Missed"
                                    ? "text-red-600 bg-red-50"
                                    : "text-zinc-600 bg-zinc-50",
                              )}
                            >
                              {item.sla_status || "-"}
                            </Badge>
                          ) : col.key === "compressor_load_percent" ? (
                            <div className="flex items-center gap-1">
                              <Gauge className="h-3 w-3 text-zinc-400" />
                              <span
                                className={cn(
                                  parseFloat(item[col.key]) > 90
                                    ? "text-red-600 font-bold"
                                    : parseFloat(item[col.key]) > 70
                                      ? "text-amber-600"
                                      : "",
                                )}
                              >
                                {formatNumber(item[col.key])}%
                              </span>
                            </div>
                          ) : col.key.includes("temp") ? (
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-zinc-400" />
                              {formatNumber(item[col.key])}
                            </div>
                          ) : col.key.includes("pressure") ? (
                            formatNumber(item[col.key])
                          ) : col.key === "reading_time" ||
                            col.key === "created_at" ? (
                            item[col.key] ? (
                              new Date(item[col.key]).toLocaleString()
                            ) : (
                              "-"
                            )
                          ) : (
                            item[col.key] || "-"
                          )}
                        </TableCell>
                      ),
                    )}
                    <TableCell className="text-right sticky right-0 bg-white group-hover:bg-zinc-50 shadow-[-10px_0_15px_rgba(0,0,0,0.02)] transition-colors px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-zinc-200/50"
                          >
                            <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase text-zinc-400">
                            Reading Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer"
                            onClick={() => {
                              setSelectedReading(item);
                              setIsEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-zinc-400" />{" "}
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-bold text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(item.log_id || item.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chiller Reading</DialogTitle>
          </DialogHeader>
          <ReadingForm
            reading={selectedReading}
            onSave={() => {
              setIsEditOpen(false);
              fetchReadings();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-zinc-800">
          <div className="flex items-center gap-2 border-r border-zinc-700 pr-6 mr-2">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse shadow-lg shadow-red-600/50">
              {selectedIds.length}
            </span>
            <span className="text-sm font-bold tracking-tight">SELECTED</span>
          </div>

          <Button
            size="sm"
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 h-9 px-6 font-bold text-xs"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            DELETE
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-500 hover:text-white ml-2"
            onClick={() => setSelectedIds([])}
          >
            <Plus className="h-5 w-5 rotate-45" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ReadingForm({
  reading,
  onSave,
}: {
  reading?: any;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<any>(
    reading || {
      site_id: "",
      chiller_id: "",
      equipment_id: "",
      date_shift: "",
      reading_time: "",
      condenser_inlet_temp: "",
      condenser_outlet_temp: "",
      evaporator_inlet_temp: "",
      evaporator_outlet_temp: "",
      compressor_suction_temp: "",
      motor_temperature: "",
      saturated_condenser_temp: "",
      saturated_suction_temp: "",
      discharge_pressure: "",
      main_suction_pressure: "",
      oil_pressure: "",
      oil_pressure_difference: "",
      condenser_inlet_pressure: "",
      condenser_outlet_pressure: "",
      evaporator_inlet_pressure: "",
      evaporator_outlet_pressure: "",
      compressor_load_percent: "",
      inline_btu_meter: "",
      set_point: "",
      sla_status: "",
      remarks: "",
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const method = reading ? "PUT" : "POST";
      const path = reading
        ? `/api/chiller-readings/${reading.log_id || reading.id}`
        : "/api/chiller-readings";

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave();
      } else {
        const err = await safeJsonParse(res);
        alert(err.error || "Operation failed");
      }
    } catch (error) {
      console.error("Save error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-2">
          Basic Information
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="site_id"
              className="text-sm font-medium text-zinc-700"
            >
              Site ID *
            </label>
            <Input
              id="site_id"
              value={formData.site_id || ""}
              onChange={handleChange}
              placeholder="e.g. SITE-001"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="chiller_id"
              className="text-sm font-medium text-zinc-700"
            >
              Chiller ID *
            </label>
            <Input
              id="chiller_id"
              value={formData.chiller_id || ""}
              onChange={handleChange}
              placeholder="e.g. CH-01"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="date_shift"
              className="text-sm font-medium text-zinc-700"
            >
              Date/Shift
            </label>
            <Input
              id="date_shift"
              value={formData.date_shift || ""}
              onChange={handleChange}
              placeholder="e.g. 2026-01-21/Morning"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="reading_time"
              className="text-sm font-medium text-zinc-700"
            >
              Reading Time
            </label>
            <Input
              id="reading_time"
              type="datetime-local"
              value={formData.reading_time || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Temperature Readings */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-red-600" />
          Temperature Readings (°C)
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="condenser_inlet_temp"
              className="text-xs font-medium text-zinc-600"
            >
              Condenser Inlet
            </label>
            <Input
              id="condenser_inlet_temp"
              type="number"
              step="0.01"
              value={formData.condenser_inlet_temp || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="condenser_outlet_temp"
              className="text-xs font-medium text-zinc-600"
            >
              Condenser Outlet
            </label>
            <Input
              id="condenser_outlet_temp"
              type="number"
              step="0.01"
              value={formData.condenser_outlet_temp || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="evaporator_inlet_temp"
              className="text-xs font-medium text-zinc-600"
            >
              Evaporator Inlet
            </label>
            <Input
              id="evaporator_inlet_temp"
              type="number"
              step="0.01"
              value={formData.evaporator_inlet_temp || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="evaporator_outlet_temp"
              className="text-xs font-medium text-zinc-600"
            >
              Evaporator Outlet
            </label>
            <Input
              id="evaporator_outlet_temp"
              type="number"
              step="0.01"
              value={formData.evaporator_outlet_temp || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="compressor_suction_temp"
              className="text-xs font-medium text-zinc-600"
            >
              Compressor Suction
            </label>
            <Input
              id="compressor_suction_temp"
              type="number"
              step="0.01"
              value={formData.compressor_suction_temp || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="motor_temperature"
              className="text-xs font-medium text-zinc-600"
            >
              Motor Temperature
            </label>
            <Input
              id="motor_temperature"
              type="number"
              step="0.01"
              value={formData.motor_temperature || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="saturated_condenser_temp"
              className="text-xs font-medium text-zinc-600"
            >
              Saturated Condenser
            </label>
            <Input
              id="saturated_condenser_temp"
              type="number"
              step="0.01"
              value={formData.saturated_condenser_temp || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="saturated_suction_temp"
              className="text-xs font-medium text-zinc-600"
            >
              Saturated Suction
            </label>
            <Input
              id="saturated_suction_temp"
              type="number"
              step="0.01"
              value={formData.saturated_suction_temp || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Pressure Readings */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-blue-600" />
          Pressure Readings
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="discharge_pressure"
              className="text-xs font-medium text-zinc-600"
            >
              Discharge Pressure
            </label>
            <Input
              id="discharge_pressure"
              type="number"
              step="0.01"
              value={formData.discharge_pressure || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="main_suction_pressure"
              className="text-xs font-medium text-zinc-600"
            >
              Main Suction
            </label>
            <Input
              id="main_suction_pressure"
              type="number"
              step="0.01"
              value={formData.main_suction_pressure || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="oil_pressure"
              className="text-xs font-medium text-zinc-600"
            >
              Oil Pressure
            </label>
            <Input
              id="oil_pressure"
              type="number"
              step="0.01"
              value={formData.oil_pressure || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="compressor_load_percent"
              className="text-xs font-medium text-zinc-600"
            >
              Compressor Load (%)
            </label>
            <Input
              id="compressor_load_percent"
              type="number"
              step="0.01"
              value={formData.compressor_load_percent || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Other */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-2">
          Additional Information
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="set_point"
              className="text-xs font-medium text-zinc-600"
            >
              Set Point
            </label>
            <Input
              id="set_point"
              type="number"
              step="0.01"
              value={formData.set_point || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="inline_btu_meter"
              className="text-xs font-medium text-zinc-600"
            >
              Inline BTU Meter
            </label>
            <Input
              id="inline_btu_meter"
              type="number"
              step="0.01"
              value={formData.inline_btu_meter || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="sla_status"
              className="text-xs font-medium text-zinc-600"
            >
              SLA Status
            </label>
            <Select
              value={formData.sla_status || ""}
              onValueChange={(v) => handleSelectChange("sla_status", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Met">Met</SelectItem>
                <SelectItem value="Missed">Missed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="remarks"
            className="text-xs font-medium text-zinc-600"
          >
            Remarks
          </label>
          <Textarea
            id="remarks"
            value={formData.remarks || ""}
            onChange={handleChange}
            placeholder="Any additional notes..."
            rows={2}
          />
        </div>
      </div>

      <DialogFooter className="pt-4 mt-2 border-t">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-sm"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {reading ? "Update Reading" : "Save Reading"}
        </Button>
      </DialogFooter>
    </div>
  );
}
