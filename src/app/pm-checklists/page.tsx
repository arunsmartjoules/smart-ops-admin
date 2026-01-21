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
  ClipboardCheck,
  Eye,
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
  { key: "checklist_id", label: "Checklist ID", default: true },
  { key: "task_name", label: "Task Name", default: true },
  { key: "maintenance_type", label: "Maintenance Type", default: true },
  { key: "asset_type", label: "Asset Type", default: true },
  { key: "field_type", label: "Field Type", default: false },
  { key: "sla_code", label: "SLA Code", default: false },
  { key: "sequence_no", label: "Sequence", default: true },
  { key: "version", label: "Version", default: true },
  { key: "status", label: "Status", default: true },
  { key: "image_mandatory", label: "Image Required", default: false },
  { key: "remarks_mandatory", label: "Remarks Required", default: false },
  { key: "site_id", label: "Site ID", default: false },
  { key: "teams", label: "Team ID", default: false },
  { key: "teams_name", label: "Team Name", default: false },
  { key: "created_by", label: "Created By", default: false },
  { key: "created_at", label: "Created At", default: false },
];

export default function PMChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter((c) => c.default).map((c) => c.key)),
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChecklists(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchChecklists = async (search: string = "") => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/pm-checklist${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      );
      const result = await safeJsonParse(res);
      if (result.success) {
        setChecklists(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch checklists", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChecklists = useMemo(() => {
    let result = [...checklists];

    if (typeFilter !== "all") {
      result = result.filter((c) => c.maintenance_type === typeFilter);
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
  }, [checklists, sortConfig, typeFilter]);

  const maintenanceTypes = useMemo(() => {
    const types = new Set(
      checklists.map((c) => c.maintenance_type).filter(Boolean),
    );
    return Array.from(types);
  }, [checklists]);

  const exportToCSV = () => {
    if (checklists.length === 0) return;

    const headers = ALL_COLUMNS.map((c) => c.label);
    const csvContent = [
      headers.join(","),
      ...checklists.map((c) =>
        ALL_COLUMNS.map((col) =>
          `"${c[col.key] || ""}"`.replace(/\n/g, " "),
        ).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pm_checklists_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredChecklists.map((c) => c.checklist_id));
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
    if (!confirm("Are you sure you want to delete this checklist?")) return;
    try {
      const res = await apiFetch(`/api/pm-checklist/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchChecklists();
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
            PM Checklists
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage preventive maintenance checklist templates and tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={loading || checklists.length === 0}
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
                <Plus className="mr-2 h-4 w-4" /> Add Checklist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add PM Checklist Task</DialogTitle>
              </DialogHeader>
              <ChecklistForm
                onSave={() => {
                  setIsAddOpen(false);
                  fetchChecklists();
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
              placeholder="Search checklists by task name, ID..."
              className="pl-10 bg-zinc-50 border-zinc-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Maintenance Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {maintenanceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <span>
            Showing{" "}
            <span className="text-zinc-900">{filteredChecklists.length}</span>{" "}
            of <span className="text-zinc-900">{checklists.length}</span> items
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
                      filteredChecklists.length > 0 &&
                      selectedIds.length === filteredChecklists.length
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
              ) : filteredChecklists.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.size + 2}
                    className="text-center py-20 text-muted-foreground font-medium"
                  >
                    No checklists found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredChecklists.map((item) => (
                  <TableRow
                    key={item.checklist_id}
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group",
                      selectedIds.includes(item.checklist_id)
                        ? "bg-red-50/30"
                        : "",
                    )}
                  >
                    <TableCell className="px-4 sticky left-0 z-10 bg-white group-hover:bg-zinc-50 transition-colors border-r border-zinc-100">
                      <Checkbox
                        checked={selectedIds.includes(item.checklist_id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(item.checklist_id, !!checked)
                        }
                      />
                    </TableCell>
                    {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                      (col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            "text-xs",
                            col.key === "task_name"
                              ? "font-bold text-zinc-900"
                              : "text-zinc-600",
                          )}
                        >
                          {col.key === "status" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                                item.status === "Active"
                                  ? "text-green-600 bg-green-50"
                                  : item.status === "Draft"
                                    ? "text-amber-600 bg-amber-50"
                                    : "text-zinc-600 bg-zinc-50",
                              )}
                            >
                              {item.status || "-"}
                            </Badge>
                          ) : col.key === "image_mandatory" ||
                            col.key === "remarks_mandatory" ? (
                            item[col.key] ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">
                                Yes
                              </Badge>
                            ) : (
                              <Badge className="bg-zinc-100 text-zinc-500 text-[10px]">
                                No
                              </Badge>
                            )
                          ) : col.key.includes("_at") ? (
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
                            Checklist Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer"
                            onClick={() => {
                              setSelectedChecklist(item);
                              setIsEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-zinc-400" />{" "}
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-bold text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(item.checklist_id)}
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
            <DialogTitle>Edit PM Checklist</DialogTitle>
          </DialogHeader>
          <ChecklistForm
            checklist={selectedChecklist}
            onSave={() => {
              setIsEditOpen(false);
              fetchChecklists();
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
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
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

function ChecklistForm({
  checklist,
  onSave,
}: {
  checklist?: any;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<any>(
    checklist || {
      task_name: "",
      maintenance_type: "",
      asset_type: "",
      field_type: "checkbox",
      sla_code: "",
      sequence_no: 1,
      version: 1,
      status: "Active",
      image_mandatory: false,
      remarks_mandatory: false,
      site_id: "",
      teams: "",
      teams_name: "",
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
      const method = checklist ? "PUT" : "POST";
      const path = checklist
        ? `/api/pm-checklist/${checklist.checklist_id}`
        : "/api/pm-checklist";

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
          <label
            htmlFor="task_name"
            className="text-sm font-medium text-zinc-700"
          >
            Task Name *
          </label>
          <Input
            id="task_name"
            value={formData.task_name || ""}
            onChange={handleChange}
            placeholder="e.g. Check AHU Filter Condition"
            className="bg-white"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="maintenance_type"
            className="text-sm font-medium text-zinc-700"
          >
            Maintenance Type
          </label>
          <Select
            value={formData.maintenance_type || ""}
            onValueChange={(v) => handleSelectChange("maintenance_type", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Preventive">Preventive</SelectItem>
              <SelectItem value="Corrective">Corrective</SelectItem>
              <SelectItem value="Predictive">Predictive</SelectItem>
              <SelectItem value="Condition-Based">Condition-Based</SelectItem>
            </SelectContent>
          </Select>
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
            placeholder="e.g. AHU, Chiller"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="field_type"
            className="text-sm font-medium text-zinc-700"
          >
            Field Type
          </label>
          <Select
            value={formData.field_type || "checkbox"}
            onValueChange={(v) => handleSelectChange("field_type", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="text">Text Input</SelectItem>
              <SelectItem value="number">Number Input</SelectItem>
              <SelectItem value="dropdown">Dropdown</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium text-zinc-700">
            Status
          </label>
          <Select
            value={formData.status || "Active"}
            onValueChange={(v) => handleSelectChange("status", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="sequence_no"
            className="text-sm font-medium text-zinc-700"
          >
            Sequence Number
          </label>
          <Input
            id="sequence_no"
            type="number"
            value={formData.sequence_no || 1}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="sla_code"
            className="text-sm font-medium text-zinc-700"
          >
            SLA Code
          </label>
          <Input
            id="sla_code"
            value={formData.sla_code || ""}
            onChange={handleChange}
            placeholder="e.g. SLA-001"
          />
        </div>

        <div className="col-span-2 flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="image_mandatory"
              checked={formData.image_mandatory || false}
              onCheckedChange={(checked) =>
                setFormData((prev: any) => ({
                  ...prev,
                  image_mandatory: !!checked,
                }))
              }
            />
            <label
              htmlFor="image_mandatory"
              className="text-sm font-medium text-zinc-700"
            >
              Image Required
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remarks_mandatory"
              checked={formData.remarks_mandatory || false}
              onCheckedChange={(checked) =>
                setFormData((prev: any) => ({
                  ...prev,
                  remarks_mandatory: !!checked,
                }))
              }
            />
            <label
              htmlFor="remarks_mandatory"
              className="text-sm font-medium text-zinc-700"
            >
              Remarks Required
            </label>
          </div>
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
          {checklist ? "Update Checklist" : "Create Checklist"}
        </Button>
      </DialogFooter>
    </div>
  );
}
