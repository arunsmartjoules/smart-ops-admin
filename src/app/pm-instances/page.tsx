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
  ClipboardList,
  Eye,
  Calendar,
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
import { Progress } from "@/components/ui/progress";

const ALL_COLUMNS = [
  { key: "instance_id", label: "Instance ID", default: true },
  { key: "title", label: "Title", default: true },
  { key: "asset_type", label: "Asset Type", default: true },
  { key: "site_id", label: "Site ID", default: false },
  { key: "asset_id", label: "Asset ID", default: false },
  { key: "location", label: "Location", default: true },
  { key: "floor", label: "Floor", default: false },
  { key: "frequency", label: "Frequency", default: true },
  { key: "status", label: "Status", default: true },
  { key: "progress", label: "Progress", default: true },
  { key: "assigned_to_name", label: "Assigned To", default: true },
  { key: "teams_name", label: "Team", default: false },
  { key: "start_due_date", label: "Due Date", default: true },
  { key: "start_datetime", label: "Start Time", default: false },
  { key: "end_datetime", label: "End Time", default: false },
  { key: "estimated_duration", label: "Est. Duration (min)", default: false },
  { key: "maintenance_id", label: "Maintenance ID", default: false },
  { key: "checklist_version", label: "Checklist Version", default: false },
  { key: "inventory_id", label: "Inventory ID", default: false },
  { key: "description", label: "Description", default: false },
  { key: "created_by", label: "Created By", default: false },
  { key: "created_at", label: "Created At", default: false },
];

export default function PMInstancesPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter((c) => c.default).map((c) => c.key)),
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInstances(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInstances = async (search: string = "") => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/pm-instances${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      );
      const result = await safeJsonParse(res);
      if (result.success) {
        setInstances(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch instances", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstances = useMemo(() => {
    let result = [...instances];

    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }

    if (frequencyFilter !== "all") {
      result = result.filter((i) => i.frequency === frequencyFilter);
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
  }, [instances, sortConfig, statusFilter, frequencyFilter]);

  const statuses = useMemo(() => {
    const stats = new Set(instances.map((i) => i.status).filter(Boolean));
    return Array.from(stats);
  }, [instances]);

  const frequencies = useMemo(() => {
    const freqs = new Set(instances.map((i) => i.frequency).filter(Boolean));
    return Array.from(freqs);
  }, [instances]);

  const exportToCSV = () => {
    if (instances.length === 0) return;

    const headers = ALL_COLUMNS.map((c) => c.label);
    const csvContent = [
      headers.join(","),
      ...instances.map((i) =>
        ALL_COLUMNS.map((col) =>
          `"${i[col.key] || ""}"`.replace(/\n/g, " "),
        ).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pm_instances_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredInstances.map((i) => i.instance_id));
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
    if (!confirm("Are you sure you want to delete this instance?")) return;
    try {
      const res = await apiFetch(`/api/pm-instances/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInstances();
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "in progress":
      case "in-progress":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-amber-600 bg-amber-50";
      case "overdue":
        return "text-red-600 bg-red-50";
      default:
        return "text-zinc-600 bg-zinc-50";
    }
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
            PM Instances
          </h1>
          <p className="text-zinc-500 mt-1">
            Track and manage preventive maintenance task instances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={loading || instances.length === 0}
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
                <Plus className="mr-2 h-4 w-4" /> Create Instance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create PM Instance</DialogTitle>
              </DialogHeader>
              <InstanceForm
                onSave={() => {
                  setIsAddOpen(false);
                  fetchInstances();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by title, asset, location..."
              className="pl-10 bg-zinc-50 border-zinc-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((stat) => (
                <SelectItem key={stat} value={stat}>
                  {stat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              {frequencies.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <span>
            Showing{" "}
            <span className="text-zinc-900">{filteredInstances.length}</span> of{" "}
            <span className="text-zinc-900">{instances.length}</span> instances
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
                      filteredInstances.length > 0 &&
                      selectedIds.length === filteredInstances.length
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
              ) : filteredInstances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.size + 2}
                    className="text-center py-20 text-muted-foreground font-medium"
                  >
                    No PM instances found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstances.map((item) => (
                  <TableRow
                    key={item.instance_id}
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group",
                      selectedIds.includes(item.instance_id)
                        ? "bg-red-50/30"
                        : "",
                    )}
                  >
                    <TableCell className="px-4 sticky left-0 z-10 bg-white group-hover:bg-zinc-50 transition-colors border-r border-zinc-100">
                      <Checkbox
                        checked={selectedIds.includes(item.instance_id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(item.instance_id, !!checked)
                        }
                      />
                    </TableCell>
                    {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                      (col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            "text-xs",
                            col.key === "title"
                              ? "font-bold text-zinc-900"
                              : "text-zinc-600",
                          )}
                        >
                          {col.key === "status" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                                getStatusColor(item.status),
                              )}
                            >
                              {item.status || "-"}
                            </Badge>
                          ) : col.key === "progress" ? (
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress
                                value={item.progress || 0}
                                className="h-2 flex-1"
                              />
                              <span className="text-[10px] font-bold text-zinc-500">
                                {item.progress || 0}%
                              </span>
                            </div>
                          ) : col.key === "frequency" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium text-zinc-600 bg-zinc-50"
                            >
                              {item.frequency || "-"}
                            </Badge>
                          ) : col.key.includes("date") ||
                            col.key.includes("datetime") ||
                            col.key.includes("_at") ? (
                            item[col.key] ? (
                              new Date(item[col.key]).toLocaleDateString()
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
                            Instance Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer"
                            onClick={() => {
                              setSelectedInstance(item);
                              setIsEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-zinc-400" />{" "}
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-bold text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(item.instance_id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit PM Instance</DialogTitle>
          </DialogHeader>
          <InstanceForm
            instance={selectedInstance}
            onSave={() => {
              setIsEditOpen(false);
              fetchInstances();
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

function InstanceForm({
  instance,
  onSave,
}: {
  instance?: any;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<any>(
    instance || {
      title: "",
      asset_type: "",
      site_id: "",
      asset_id: "",
      location: "",
      floor: "",
      frequency: "Daily",
      status: "Pending",
      progress: 0,
      assigned_to: "",
      assigned_to_name: "",
      teams: "",
      teams_name: "",
      start_due_date: "",
      estimated_duration: 30,
      description: "",
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: any) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const method = instance ? "PUT" : "POST";
      const path = instance
        ? `/api/pm-instances/${instance.instance_id}`
        : "/api/pm-instances";

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
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2 col-span-2">
          <label htmlFor="title" className="text-sm font-medium text-zinc-700">
            Title *
          </label>
          <Input
            id="title"
            value={formData.title || ""}
            onChange={handleChange}
            placeholder="e.g. Monthly AHU Maintenance"
            className="bg-white"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="asset_type"
            className="text-sm font-medium text-zinc-700"
          >
            Asset Type
          </label>
          <Input
            id="asset_type"
            value={formData.asset_type || ""}
            onChange={handleChange}
            placeholder="e.g. AHU"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="frequency"
            className="text-sm font-medium text-zinc-700"
          >
            Frequency
          </label>
          <Select
            value={formData.frequency || "Daily"}
            onValueChange={(v) => handleSelectChange("frequency", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium text-zinc-700">
            Status
          </label>
          <Select
            value={formData.status || "Pending"}
            onValueChange={(v) => handleSelectChange("status", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="progress"
            className="text-sm font-medium text-zinc-700"
          >
            Progress (%)
          </label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={formData.progress || 0}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="location"
            className="text-sm font-medium text-zinc-700"
          >
            Location
          </label>
          <Input
            id="location"
            value={formData.location || ""}
            onChange={handleChange}
            placeholder="e.g. Building A"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="floor" className="text-sm font-medium text-zinc-700">
            Floor
          </label>
          <Input
            id="floor"
            value={formData.floor || ""}
            onChange={handleChange}
            placeholder="e.g. 3rd Floor"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="start_due_date"
            className="text-sm font-medium text-zinc-700"
          >
            Due Date
          </label>
          <Input
            id="start_due_date"
            type="date"
            value={formData.start_due_date || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="estimated_duration"
            className="text-sm font-medium text-zinc-700"
          >
            Est. Duration (minutes)
          </label>
          <Input
            id="estimated_duration"
            type="number"
            value={formData.estimated_duration || 30}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="assigned_to_name"
            className="text-sm font-medium text-zinc-700"
          >
            Assigned To
          </label>
          <Input
            id="assigned_to_name"
            value={formData.assigned_to_name || ""}
            onChange={handleChange}
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="teams_name"
            className="text-sm font-medium text-zinc-700"
          >
            Team
          </label>
          <Input
            id="teams_name"
            value={formData.teams_name || ""}
            onChange={handleChange}
            placeholder="e.g. HVAC Team"
          />
        </div>

        <div className="grid gap-2 col-span-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-zinc-700"
          >
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="Additional details..."
            rows={3}
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
          {instance ? "Update Instance" : "Create Instance"}
        </Button>
      </DialogFooter>
    </div>
  );
}
