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
  Calendar,
  Clock,
  User,
  FileUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { apiFetch, safeJsonParse } from "@/lib/api";
import { TableSkeleton } from "@/components/table-skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Column {
  key: string;
  label: string;
  default?: boolean;
}

interface SiteLogTableProps {
  logType: string; // 'Temp RH', 'Water Parameters', 'Chemical Dosing'
  columns: Column[];
  title: string;
  description: string;
}

import { AdvancedImportWizard } from "./import/advanced-import-wizard";

// ... (keep props interface)

export function SiteLogTable({
  logType,
  columns,
  title,
  description,
}: SiteLogTableProps) {
  // ... (keep existing state)
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set([
      "created_at",
      "site_id",
      "exicuter_id",
      ...columns.filter((c) => c.default !== false).map((c) => c.key),
      "remarks",
    ]),
  );
  const [siteFilter, setSiteFilter] = useState<string>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState(false);
  const [editLog, setEditLog] = useState<any | null>(null);

  // Import State
  const [importOpen, setImportOpen] = useState(false);

  // Helper to get config ID based on logType
  const getConfigId = (type: string) => {
    if (type === "Temp RH") return "site-logs-temp-rh";
    if (type === "Water Parameters") return "site-logs-water";
    if (type === "Chemical Dosing") return "site-logs-chemical";
    return "";
  };

  const allColumns = [
    { key: "created_at", label: "Date" },
    { key: "site_id", label: "Site ID" },
    { key: "exicuter_id", label: "Technician" },
    ...columns,
    { key: "remarks", label: "Remarks" },
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/site-logs?type=${encodeURIComponent(logType)}`,
      );
      const result = await safeJsonParse(res);
      if (result.success) {
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error(`Failed to fetch ${logType} logs`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logType]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (siteFilter !== "all") {
      result = result.filter((r) => r.site_id === siteFilter);
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.site_id?.toLowerCase().includes(s) ||
          r.exicuter_id?.toLowerCase().includes(s) ||
          r.remarks?.toLowerCase().includes(s),
      );
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
  }, [logs, sortConfig, siteFilter, searchTerm]);

  const sites = useMemo(() => {
    const siteSet = new Set(logs.map((r) => r.site_id).filter(Boolean));
    return Array.from(siteSet);
  }, [logs]);

  const toggleColumn = (key: string) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setVisibleColumns(newSet);
  };

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map((l) => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Action Handlers
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/api/site-logs/${deleteId}`, { method: "DELETE" });
      setLogs((prev) => prev.filter((l) => l.id !== deleteId));
      setDeleteId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await apiFetch("/api/site-logs/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
        headers: { "Content-Type": "application/json" },
      });
      setLogs((prev) => prev.filter((l) => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
      setBulkDeleteConfirmation(false);
    } catch (error) {
      console.error("Bulk delete failed", error);
    }
  };

  const handleEditSave = async () => {
    if (!editLog) return;
    try {
      const res = await apiFetch(`/api/site-logs/${editLog.id}`, {
        method: "PUT",
        body: JSON.stringify(editLog),
        headers: { "Content-Type": "application/json" },
      });
      const result = await safeJsonParse(res);
      if (result.success) {
        setLogs((prev) =>
          prev.map((l) => (l.id === editLog.id ? result.data : l)),
        );
        setEditLog(null);
      }
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleExport = () => {
    // Generate CSV
    const itemsToExport =
      selectedIds.size > 0 ? logs.filter((l) => selectedIds.has(l.id)) : logs;

    const header = allColumns.map((c) => c.label).join(",");
    const rows = itemsToExport.map((item) =>
      allColumns.map((c) => JSON.stringify(item[c.key] || "")).join(","),
    );
    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSuccess = () => {
    fetchLogs();
    // Wizard will be closed by default in its done step or we can auto close
    // Actually wizard doesn't auto close, user clicks Done.
    // But if we want to confirm refresh:
    // fetchLogs called.
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="text-zinc-500 mt-1">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-zinc-300 gap-2"
            onClick={() => setImportOpen(true)}
          >
            <FileUp className="h-4 w-4" /> Import
          </Button>
          <Button
            variant="outline"
            className="border-zinc-300 gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export
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
              {allColumns.map((col) => (
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

      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search logs..."
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
            {sites.map((site: any) => (
              <SelectItem key={site} value={site}>
                {site}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <div className="ml-auto flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
            <span className="text-sm text-zinc-500 font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setBulkDeleteConfirmation(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete Selection
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table className="border-separate border-spacing-0">
            <TableHeader className="bg-zinc-50 sticky top-0 z-30">
              <TableRow>
                <TableHead className="w-[40px] bg-zinc-50 border-b">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    checked={
                      selectedIds.size === filteredLogs.length &&
                      filteredLogs.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                {allColumns
                  .filter((c) => visibleColumns.has(c.key))
                  .map((col) => (
                    <TableHead
                      key={col.key}
                      className="bg-zinc-50 shadow-sm border-b"
                    >
                      <button
                        className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        {sortConfig?.key === col.key ? (
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
                  ))}
                <TableHead className="w-[80px] bg-zinc-50 border-b text-right">
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
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.size + 2}
                    className="text-center py-20 text-muted-foreground font-medium"
                  >
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group text-xs",
                      selectedIds.has(item.id) &&
                        "bg-blue-50/30 hover:bg-blue-50/50",
                    )}
                  >
                    <TableCell className="py-3">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                      />
                    </TableCell>
                    {allColumns
                      .filter((c) => visibleColumns.has(c.key))
                      .map((col) => (
                        <TableCell key={col.key} className="py-3">
                          {col.key === "created_at" ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900">
                                {format(new Date(item[col.key]), "dd MMM yyyy")}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {format(new Date(item[col.key]), "hh:mm a")}
                              </span>
                            </div>
                          ) : col.key === "exicuter_id" ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                <User className="h-3 w-3 text-red-600" />
                              </div>
                              <span className="font-medium text-zinc-700">
                                {item[col.key] || "Unknown"}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="truncate max-w-[200px] block"
                              title={String(item[col.key] || "")}
                            >
                              {item[col.key] || "-"}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-blue-600"
                          onClick={() => setEditLog(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-red-600"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog (Simplified) */}
      {editLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold">Edit Log</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Remarks
                </label>
                <Input
                  value={editLog.remarks || ""}
                  onChange={(e) =>
                    setEditLog({ ...editLog, remarks: e.target.value })
                  }
                />
              </div>
              {/*  Add more fields dynamically if needed, keeping it simple for now */}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditLog(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-lg font-bold text-red-600">Delete Log?</h2>
              <p className="text-sm text-zinc-500 mt-1">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-lg font-bold text-red-600">
                Delete {selectedIds.size} Logs?
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Are you sure you want to delete these logs? This cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteConfirmation(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Import Wizard */}
      {importOpen && (
        <AdvancedImportWizard
          configId={getConfigId(logType)}
          onClose={() => setImportOpen(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
