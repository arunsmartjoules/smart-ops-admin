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
  Building2,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Map,
  X,
  CheckSquare,
  AlertCircle,
  MessageSquare,
  Filter,
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
import { apiFetch, safeJsonParse } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import NextDynamic from "next/dynamic";
import { TableSkeleton } from "@/components/table-skeleton";

// Dynamic import for the map component (Leaflet doesn't work with SSR)
const InteractiveMapPicker = NextDynamic(
  () => import("@/components/interactive-map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-zinc-100 animate-pulse rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ),
  },
);

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set([
      "site_code",
      "name",
      "address",
      "city",
      "state",
      "status",
      "radius",
    ]),
  );

  const ALL_COLUMNS = [
    { key: "site_code", label: "Site Code" },
    { key: "name", label: "Site Name" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "status", label: "Status" },
    { key: "is_active", label: "Is Active" },
    { key: "radius", label: "Radius (m)" },
    { key: "latitude", label: "Latitude" },
    { key: "longitude", label: "Longitude" },
    { key: "project_type", label: "Project Type" },
    { key: "client", label: "Client" },
    { key: "site_contact_number", label: "Contact" },
    { key: "task_executor", label: "Executor" },
    { key: "seo", label: "SEO" },
    { key: "rem", label: "REM" },
    { key: "site_id", label: "Site ID" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ];

  const toggleColumn = (key: string) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setVisibleColumns(newSet);
  };

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
      fetchSites(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSites = async (search: string = "") => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/sites${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      );
      const result = await safeJsonParse(res);
      if (result.success) {
        setSites(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch sites", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm("Are you sure you want to delete this site?")) return;
    try {
      const res = await apiFetch(`/api/sites/${siteId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSites();
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSites.map((s) => s.site_id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (siteId: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(siteId);
    } else {
      newSet.delete(siteId);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const res = await apiFetch("/api/sites/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const result = await safeJsonParse(res);
      if (result.success) {
        alert(`Sites deleted successfully`);
        setSelectedIds(new Set());
        setIsBulkDeleteOpen(false);
        fetchSites();
      } else {
        alert(result.error || "Failed to delete sites");
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete sites");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEdit = async () => {
    setIsProcessing(true);
    try {
      const res = await apiFetch("/api/sites/bulk-update", {
        method: "POST",
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          updates: { is_active: bulkStatus },
        }),
      });
      const result = await safeJsonParse(res);
      if (result.success) {
        alert(`Sites updated successfully`);
        setSelectedIds(new Set());
        setIsBulkEditOpen(false);
        fetchSites();
      } else {
        alert(result.error || "Failed to update sites");
      }
    } catch (error: any) {
      alert(error.message || "Failed to update sites");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSites = useMemo(() => {
    return [...sites].sort((a, b) => {
      if (!sortConfig) return 0;
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [sites, sortConfig]);

  const allSelected =
    filteredSites.length > 0 &&
    filteredSites.every((s) => selectedIds.has(s.site_id));

  const SortableHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: string;
  }) => (
    <TableHead className="bg-white text-zinc-900 font-bold sticky top-0 z-10 shadow-sm border-b whitespace-nowrap">
      <button
        className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[11px] tracking-wider"
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
      {/* Modern Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Sites
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage operational locations and facilities.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 transition-all">
              <Plus className="mr-2 h-4 w-4" /> Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
            </DialogHeader>
            <SiteForm
              onSave={() => {
                setIsAddOpen(false);
                fetchSites();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between shrink-0 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search sites..."
            className="pl-10 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-red-300 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-zinc-300">
                <Filter className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[80vh] overflow-y-auto z-100">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 cursor-pointer rounded-md transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(col.key);
                  }}
                >
                  <Checkbox
                    id={`col-${col.key}`}
                    checked={visibleColumns.has(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  <label
                    htmlFor={`col-${col.key}`}
                    className="text-xs font-medium cursor-pointer flex-1"
                  >
                    {col.label}
                  </label>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedIds.size} site{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px bg-zinc-600" />
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-zinc-800"
            onClick={() => setIsBulkEditOpen(true)}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            Edit Status
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-zinc-800 hover:text-red-300"
            onClick={() => setIsBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-zinc-800"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modern Table Container */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table className="border-separate border-spacing-0 min-w-[1200px]">
            <TableHeader className="bg-zinc-50 sticky top-0 z-30">
              <TableRow>
                <TableHead className="w-[50px] bg-zinc-50/80 backdrop-blur sticky top-0 left-0 z-40 shadow-sm border-b px-4 text-center">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                  (col) => (
                    <TableHead
                      key={col.key}
                      className="bg-zinc-50 sticky top-0 z-20 shadow-sm border-b"
                    >
                      <button
                        className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900 whitespace-nowrap"
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
                  ),
                )}
                <TableHead className="text-right bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-30 shadow-sm border-b border-l px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableSkeleton columnCount={11} rowCount={10} />
              ) : filteredSites.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-20 text-muted-foreground"
                  >
                    No sites found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSites.map((site) => (
                  <TableRow
                    key={site.site_id}
                    className={cn(
                      "hover:bg-zinc-50/50 transition-colors group",
                      selectedIds.has(site.site_id) && "bg-red-50/30",
                    )}
                  >
                    <TableCell className="px-4 sticky left-0 z-10 bg-white group-hover:bg-zinc-50 transition-colors border-r border-zinc-100 text-center">
                      <Checkbox
                        checked={selectedIds.has(site.site_id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(site.site_id, !!checked)
                        }
                      />
                    </TableCell>
                    {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map(
                      (col) => (
                        <TableCell key={col.key}>
                          {col.key === "status" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                                site.status === "Active" ||
                                  site.is_active !== false
                                  ? "text-green-600 bg-green-50"
                                  : "text-red-600 bg-red-50",
                              )}
                            >
                              {site.status ||
                                (site.is_active !== false
                                  ? "Active"
                                  : "Inactive")}
                            </Badge>
                          ) : col.key === "is_active" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none border-none",
                                site.is_active !== false
                                  ? "text-green-600 bg-green-50"
                                  : "text-red-600 bg-red-50",
                              )}
                            >
                              {site.is_active !== false ? "Active" : "Inactive"}
                            </Badge>
                          ) : col.key === "name" ? (
                            <div className="flex items-center gap-2 font-bold text-zinc-900 whitespace-nowrap">
                              {site.name}
                            </div>
                          ) : col.key === "site_code" ? (
                            <span className="font-mono text-[11px] font-bold text-zinc-400 whitespace-nowrap">
                              {site[col.key] || "N/A"}
                            </span>
                          ) : col.key === "radius" ? (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs whitespace-nowrap"
                            >
                              {site[col.key] || 500}m
                            </Badge>
                          ) : col.key === "latitude" ||
                            col.key === "longitude" ? (
                            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                              {site[col.key]
                                ? Number(site[col.key]).toFixed(4)
                                : "-"}
                            </span>
                          ) : col.key === "location" ? (
                            site.latitude && site.longitude ? (
                              <a
                                href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline text-xs whitespace-nowrap"
                              >
                                <MapPin className="h-3 w-3" /> View Map
                              </a>
                            ) : (
                              "-"
                            )
                          ) : col.key.includes("created_at") ||
                            col.key.includes("updated_at") ? (
                            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                              {site[col.key]
                                ? format(
                                    new Date(site[col.key]),
                                    "MMM dd, yyyy",
                                  )
                                : "-"}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] block">
                              {site[col.key] || "-"}
                            </span>
                          )}
                        </TableCell>
                      ),
                    )}
                    <TableCell className="text-right sticky right-0 bg-white group-hover:bg-zinc-50 shadow-[-10px_0_15px_rgba(0,0,0,0.02)] transition-colors px-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentSite(site);
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDelete(site.site_id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
          </DialogHeader>
          <SiteForm
            site={currentSite}
            onSave={() => {
              setIsEditOpen(false);
              fetchSites();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Sites</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete {selectedIds.size} site
            {selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Sites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedIds.size} Sites</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={bulkStatus ? "true" : "false"}
                onValueChange={(val) => setBulkStatus(val === "true")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleBulkEdit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckSquare className="h-4 w-4 mr-2" />
              )}
              Update Sites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SiteForm({ site, onSave }: { site?: any; onSave: () => void }) {
  const [formData, setFormData] = useState(
    site || {
      site_code: "",
      name: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      latitude: "",
      longitude: "",
      is_active: true,
      radius: 500,
      project_type: "",
      client: "",
      site_contact_number: "",
      seo: "",
      rem: "",
      status: "Active",
      task_executor: "",
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleChange = (e: any) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const [whatsappGroupId, setWhatsappGroupId] = useState("");
  const [initialMapping, setInitialMapping] = useState<any>(null);

  useEffect(() => {
    if (site) {
      fetchSiteMapping();
    }
  }, [site]);

  const fetchSiteMapping = async () => {
    try {
      const res = await apiFetch("/api/whatsapp/mappings");
      const result = await safeJsonParse(res);
      if (result.success) {
        const mapping = result.data.find(
          (m: any) => m.site_id === site.site_id,
        );
        if (mapping) {
          setWhatsappGroupId(mapping.whatsapp_group_id || "");
          setInitialMapping(mapping);
        }
      }
    } catch (e) {
      console.error("Failed to fetch mapping", e);
    }
  };

  const handleMapSelect = (lat: number, lng: number, radius: number) => {
    setFormData((prev: any) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      radius: radius,
    }));
    setIsMapOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const method = site ? "PUT" : "POST";
      const path = site ? `/api/sites/${site.site_id}` : "/api/sites";

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Save WhatsApp Mapping if changed
        const savedSite = site || (await safeJsonParse(res)).data;
        const targetSiteId = site ? site.site_id : savedSite.site_id;

        if (whatsappGroupId !== (initialMapping?.whatsapp_group_id || "")) {
          const mappingData = {
            site_id: targetSiteId,
            site_name: formData.name,
            whatsapp_group_id: whatsappGroupId,
            is_active: true,
          };

          const mappingPath = initialMapping
            ? `/api/whatsapp/mappings/${initialMapping.id}`
            : "/api/whatsapp/mappings";

          await apiFetch(mappingPath, {
            method: initialMapping ? "PUT" : "POST",
            body: JSON.stringify(mappingData),
          });
        }

        onSave();
      } else {
        const result = await safeJsonParse(res);
        alert(result.error || "Failed to save site");
      }
    } catch (error) {
      console.error("Save error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label
            htmlFor="site_code"
            className="text-sm font-medium text-zinc-700"
          >
            Site Code
          </label>
          <Input
            id="site_code"
            value={formData.site_code || ""}
            onChange={handleChange}
            placeholder="e.g. DEL-001"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700">
            Site Name *
          </label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={handleChange}
            placeholder="e.g. Delhi Headquarters"
            className="bg-white border-zinc-200"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="address" className="text-sm font-medium text-zinc-700">
          Address
        </label>
        <Input
          id="address"
          value={formData.address || ""}
          onChange={handleChange}
          placeholder="e.g. 123 Main Street, Okhla"
          className="bg-white border-zinc-200"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <label htmlFor="city" className="text-sm font-medium text-zinc-700">
            City
          </label>
          <Input
            id="city"
            value={formData.city || ""}
            onChange={handleChange}
            placeholder="e.g. New Delhi"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="state" className="text-sm font-medium text-zinc-700">
            State
          </label>
          <Input
            id="state"
            value={formData.state || ""}
            onChange={handleChange}
            placeholder="e.g. Delhi"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="country"
            className="text-sm font-medium text-zinc-700"
          >
            Country
          </label>
          <Input
            id="country"
            value={formData.country || ""}
            onChange={handleChange}
            placeholder="e.g. India"
            className="bg-white border-zinc-200"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-700">
          Location Coordinates
        </label>
        <div className="flex gap-2">
          <Input
            id="latitude"
            value={formData.latitude || ""}
            onChange={handleChange}
            placeholder="Latitude"
            className="flex-1 bg-white border-zinc-200"
          />
          <Input
            id="longitude"
            value={formData.longitude || ""}
            onChange={handleChange}
            placeholder="Longitude"
            className="flex-1 bg-white border-zinc-200"
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-zinc-200 hover:bg-zinc-100"
            onClick={() => setIsMapOpen(true)}
          >
            <Map className="h-4 w-4 mr-2 text-zinc-500" />
            Pick on Map
          </Button>
        </div>
        {formData.latitude && formData.longitude && (
          <a
            href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            <MapPin className="h-3 w-3" />
            View on Google Maps
          </a>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <label
          htmlFor="whatsapp_group_id"
          className="text-sm font-bold text-zinc-900 flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-red-600" />
          WhatsApp Group ID
        </label>
        <Input
          id="whatsapp_group_id"
          value={whatsappGroupId}
          onChange={(e) => setWhatsappGroupId(e.target.value)}
          placeholder="e.g. 12036304xxxxxxxxxx@g.us"
          className="bg-zinc-50 border-zinc-200"
        />
        <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 uppercase tracking-tight">
          <AlertCircle className="w-3 h-3" /> Notifications will be sent to this
          group when ticket status changes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div className="grid gap-2">
          <label
            htmlFor="project_type"
            className="text-sm font-medium text-zinc-700"
          >
            Project Type
          </label>
          <Input
            id="project_type"
            value={formData.project_type || ""}
            onChange={handleChange}
            placeholder="e.g. JoulePura"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="client" className="text-sm font-medium text-zinc-700">
            Client Name
          </label>
          <Input
            id="client"
            value={formData.client || ""}
            onChange={handleChange}
            placeholder="e.g. Apollo Hospitals"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="site_contact_number"
            className="text-sm font-medium text-zinc-700"
          >
            Site Contact
          </label>
          <Input
            id="site_contact_number"
            value={formData.site_contact_number || ""}
            onChange={handleChange}
            placeholder="+91 ..."
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="task_executor"
            className="text-sm font-medium text-zinc-700"
          >
            Task Executor
          </label>
          <Input
            id="task_executor"
            value={formData.task_executor || ""}
            onChange={handleChange}
            placeholder="Executor Name"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="seo" className="text-sm font-medium text-zinc-700">
            SEO
          </label>
          <Input
            id="seo"
            value={formData.seo || ""}
            onChange={handleChange}
            placeholder="SEO Name"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="rem" className="text-sm font-medium text-zinc-700">
            REM
          </label>
          <Input
            id="rem"
            value={formData.rem || ""}
            onChange={handleChange}
            placeholder="REM Name"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium text-zinc-700">
            Operational Status
          </label>
          <Select
            value={formData.status || "Active"}
            onValueChange={(val) => setFormData({ ...formData, status: val })}
          >
            <SelectTrigger className="w-full bg-white border-zinc-200">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Under Maintenance">
                Under Maintenance
              </SelectItem>
              <SelectItem value="Proposed">Proposed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active !== false}
          onCheckedChange={(checked) =>
            setFormData((prev: any) => ({
              ...prev,
              is_active: !!checked,
              status: checked ? "Active" : "Inactive",
            }))
          }
        />
        <label
          htmlFor="is_active"
          className="text-sm font-medium text-zinc-700 cursor-pointer"
        >
          Site is Active
        </label>
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
          {site ? "Update Site" : "Create Site"}
        </Button>
      </DialogFooter>

      {/* Map Picker Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Pick Location on Map</DialogTitle>
          </DialogHeader>
          <InteractiveMapPicker
            initialLat={
              formData.latitude ? parseFloat(formData.latitude) : 28.6139
            }
            initialLng={
              formData.longitude ? parseFloat(formData.longitude) : 77.209
            }
            onSelect={handleMapSelect}
            onCancel={() => setIsMapOpen(false)}
            initialRadius={formData.radius || 500}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
