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
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Package,
  Eye,
  EyeOff,
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
import { apiFetch, safeJsonParse } from "@/lib/api";
import { TableSkeleton } from "@/components/table-skeleton";
import { cn } from "@/lib/utils";
import { ImportDialog } from "@/components/import-dialog";

// All columns from the database
const ALL_COLUMNS = [
  { key: "asset_id", label: "Asset ID", default: true },
  { key: "asset_name", label: "Asset Name", default: true },
  { key: "category", label: "Category", default: true },
  { key: "asset_type", label: "Asset Type", default: true },
  { key: "equipment_type", label: "Equipment Type", default: false },
  { key: "site_id", label: "Site ID", default: false },
  { key: "location", label: "Location", default: true },
  { key: "floor", label: "Floor", default: false },
  { key: "make", label: "Make", default: true },
  { key: "model", label: "Model", default: true },
  { key: "serial_number", label: "Serial Number", default: false },
  { key: "status", label: "Status", default: true },
  { key: "criticality", label: "Criticality", default: false },
  { key: "installation_date", label: "Installation Date", default: false },
  { key: "warranty_start_date", label: "Warranty Start", default: false },
  { key: "warranty_end_date", label: "Warranty End", default: false },
  { key: "vendor_id", label: "Vendor ID", default: false },
  { key: "amc_cmc_provider", label: "AMC/CMC Provider", default: false },
  { key: "item_name", label: "Item Name", default: false },
  { key: "item_type", label: "Item Type", default: false },
  { key: "item_code", label: "Item Code", default: false },
  { key: "inventory_id", label: "Inventory ID", default: false },
  { key: "qr_id", label: "QR ID", default: false },
  { key: "area_type", label: "Area Type", default: false },
  { key: "area_floor_id", label: "Area/Floor ID", default: false },
  { key: "created_at", label: "Created At", default: false },
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter((c) => c.default).map((c) => c.key)),
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAssets = async (search: string = "") => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/assets${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      );
      const result = await safeJsonParse(res);
      if (result.success) {
        setAssets(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Apply sorting
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
  }, [assets, sortConfig, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    const cats = new Set(assets.map((a) => a.category).filter(Boolean));
    return Array.from(cats);
  }, [assets]);

  const statuses = useMemo(() => {
    const stats = new Set(assets.map((a) => a.status).filter(Boolean));
    return Array.from(stats);
  }, [assets]);

  const exportToCSV = () => {
    if (assets.length === 0) return;

    const headers = ALL_COLUMNS.map((c) => c.label);
    const csvContent = [
      headers.join(","),
      ...assets.map((a) =>
        ALL_COLUMNS.map((c) => `"${a[c.key] || ""}"`.replace(/\n/g, " ")).join(
          ",",
        ),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `assets_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAssets.map((a) => a.asset_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (assetId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, assetId] : prev.filter((id) => id !== assetId),
    );
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(`Are you sure you want to delete ${selectedIds.length} assets?`)
    )
      return;

    setIsBulkDeleting(true);
    try {
      await apiFetch("/api/assets/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      fetchAssets(searchTerm);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await apiFetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAssets();
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
            Assets
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage equipment, machinery, and facility assets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={loading || assets.length === 0}
            className="border-zinc-300 hover:bg-zinc-100"
          >
            <Download className="mr-2 h-4 w-4 text-zinc-500" /> Export CSV
          </Button>

          <ImportDialog
            type="assets"
            onSuccess={() => fetchAssets(searchTerm)}
          />

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
                <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <AssetForm
                onSave={() => {
                  setIsAddOpen(false);
                  fetchAssets();
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
              placeholder="Search assets by name, ID, make, model..."
              className="pl-10 bg-zinc-50 border-zinc-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <span>
            Showing{" "}
            <span className="text-zinc-900">{filteredAssets.length}</span> of{" "}
            <span className="text-zinc-900">{assets.length}</span> assets
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
                      filteredAssets.length > 0 &&
                      selectedIds.length === filteredAssets.length
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
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.size + 2}
                    className="text-center py-20 text-muted-foreground font-medium"
                  >
                    No assets found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow
                    key={asset.asset_id}
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group",
                      selectedIds.includes(asset.asset_id)
                        ? "bg-red-50/30"
                        : "",
                    )}
                  >
                    <TableCell className="px-4 sticky left-0 z-10 bg-white group-hover:bg-zinc-50 transition-colors border-r border-zinc-100">
                      <Checkbox
                        checked={selectedIds.includes(asset.asset_id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(asset.asset_id, !!checked)
                        }
                      />
                    </TableCell>
                    {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                      (col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            "text-xs",
                            col.key === "asset_name"
                              ? "font-bold text-zinc-900"
                              : "text-zinc-600",
                            col.key === "status" ? "" : "",
                          )}
                        >
                          {col.key === "status" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                                asset.status === "Active" ||
                                  asset.status === "Operational"
                                  ? "text-green-600 bg-green-50"
                                  : asset.status === "Under Maintenance"
                                    ? "text-amber-600 bg-amber-50"
                                    : asset.status === "Inactive" ||
                                        asset.status === "Decommissioned"
                                      ? "text-red-600 bg-red-50"
                                      : "text-zinc-600 bg-zinc-50",
                              )}
                            >
                              {asset.status || "-"}
                            </Badge>
                          ) : col.key === "criticality" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                                asset.criticality === "High"
                                  ? "text-red-600 bg-red-50"
                                  : asset.criticality === "Medium"
                                    ? "text-amber-600 bg-amber-50"
                                    : "text-green-600 bg-green-50",
                              )}
                            >
                              {asset.criticality || "-"}
                            </Badge>
                          ) : col.key.includes("date") ? (
                            asset[col.key] ? (
                              new Date(asset[col.key]).toLocaleDateString()
                            ) : (
                              "-"
                            )
                          ) : (
                            asset[col.key] || "-"
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
                            Asset Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-zinc-400" />{" "}
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-bold text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(asset.asset_id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Asset
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset Details</DialogTitle>
          </DialogHeader>
          <AssetForm
            asset={selectedAsset}
            onSave={() => {
              setIsEditOpen(false);
              fetchAssets();
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
            className="bg-red-600 hover:bg-red-700 h-9 px-6 font-bold text-xs shadow-lg shadow-red-600/20"
            disabled={isBulkDeleting}
            onClick={handleBulkDelete}
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

function AssetForm({ asset, onSave }: { asset?: any; onSave: () => void }) {
  const [formData, setFormData] = useState<any>(
    asset || {
      asset_name: "",
      category: "",
      asset_type: "",
      equipment_type: "",
      site_id: "",
      location: "",
      floor: "",
      make: "",
      model: "",
      serial_number: "",
      status: "Active",
      criticality: "Medium",
      installation_date: "",
      warranty_start_date: "",
      warranty_end_date: "",
      vendor_id: "",
      amc_cmc_provider: "",
      item_name: "",
      item_type: "",
      item_code: "",
      inventory_id: "",
      qr_id: "",
      area_type: "",
      area_floor_id: "",
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
      const method = asset ? "PUT" : "POST";
      const path = asset ? `/api/assets/${asset.asset_id}` : "/api/assets";

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
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="asset_name"
              className="text-sm font-medium text-zinc-700"
            >
              Asset Name *
            </label>
            <Input
              id="asset_name"
              value={formData.asset_name || ""}
              onChange={handleChange}
              placeholder="e.g. AHU-01"
              className="bg-white"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="category"
              className="text-sm font-medium text-zinc-700"
            >
              Category
            </label>
            <Select
              value={formData.category || ""}
              onValueChange={(v) => handleSelectChange("category", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HVAC">HVAC</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Plumbing">Plumbing</SelectItem>
                <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                <SelectItem value="IT/Networking">IT/Networking</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
              placeholder="e.g. Air Handling Unit"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="status"
              className="text-sm font-medium text-zinc-700"
            >
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
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Under Maintenance">
                  Under Maintenance
                </SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="criticality"
              className="text-sm font-medium text-zinc-700"
            >
              Criticality
            </label>
            <Select
              value={formData.criticality || "Medium"}
              onValueChange={(v) => handleSelectChange("criticality", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="equipment_type"
              className="text-sm font-medium text-zinc-700"
            >
              Equipment Type
            </label>
            <Input
              id="equipment_type"
              value={formData.equipment_type || ""}
              onChange={handleChange}
              placeholder="e.g. Chiller"
            />
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-2">
          Location
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="site_id"
              className="text-sm font-medium text-zinc-700"
            >
              Site ID
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
            <label
              htmlFor="floor"
              className="text-sm font-medium text-zinc-700"
            >
              Floor
            </label>
            <Input
              id="floor"
              value={formData.floor || ""}
              onChange={handleChange}
              placeholder="e.g. 3rd Floor"
            />
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-2">
          Technical Details
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label htmlFor="make" className="text-sm font-medium text-zinc-700">
              Make
            </label>
            <Input
              id="make"
              value={formData.make || ""}
              onChange={handleChange}
              placeholder="e.g. Carrier"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="model"
              className="text-sm font-medium text-zinc-700"
            >
              Model
            </label>
            <Input
              id="model"
              value={formData.model || ""}
              onChange={handleChange}
              placeholder="e.g. 30XA-1002"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="serial_number"
              className="text-sm font-medium text-zinc-700"
            >
              Serial Number
            </label>
            <Input
              id="serial_number"
              value={formData.serial_number || ""}
              onChange={handleChange}
              placeholder="e.g. SN12345678"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-2">
          Dates & Warranty
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="installation_date"
              className="text-sm font-medium text-zinc-700"
            >
              Installation Date
            </label>
            <Input
              id="installation_date"
              type="date"
              value={formData.installation_date || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="warranty_start_date"
              className="text-sm font-medium text-zinc-700"
            >
              Warranty Start
            </label>
            <Input
              id="warranty_start_date"
              type="date"
              value={formData.warranty_start_date || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="warranty_end_date"
              className="text-sm font-medium text-zinc-700"
            >
              Warranty End
            </label>
            <Input
              id="warranty_end_date"
              type="date"
              value={formData.warranty_end_date || ""}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="vendor_id"
              className="text-sm font-medium text-zinc-700"
            >
              Vendor ID
            </label>
            <Input
              id="vendor_id"
              value={formData.vendor_id || ""}
              onChange={handleChange}
              placeholder="e.g. VEN-001"
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="amc_cmc_provider"
              className="text-sm font-medium text-zinc-700"
            >
              AMC/CMC Provider
            </label>
            <Input
              id="amc_cmc_provider"
              value={formData.amc_cmc_provider || ""}
              onChange={handleChange}
              placeholder="e.g. Service Company Ltd"
            />
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
          {asset ? "Update Asset" : "Create Asset"}
        </Button>
      </DialogFooter>
    </div>
  );
}
