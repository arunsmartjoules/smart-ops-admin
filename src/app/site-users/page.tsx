"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserCheck,
  Plus,
  Search,
  Loader2,
  Trash2,
  Edit,
  Star,
  Building2,
  User,
  X,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";

interface SiteUser {
  site_id: string;
  name: string;
  site_code: string;
  user_id: string;
  user_name: string;
  employee_code: string;
  designation: string;
  department: string;
  role_at_site: string;
  is_primary: boolean;
}

interface Site {
  site_id: string;
  name: string;
  site_code: string;
}

interface User {
  user_id: string;
  name: string;
  email: string;
  employee_code: string;
}

export default function SiteUsersPage() {
  const { isSuperAdmin } = useAuth();
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SiteUser | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    site_id: "",
    role_at_site: "staff",
    is_primary: false,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [siteSearchTerm, setSiteSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSiteUsers();
    fetchSites();
    fetchUsers();
  }, []);

  const fetchSiteUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/site-users?limit=500");
      const result = await res.json();
      if (result.success) {
        const flattenedData = (result.data || []).map((su: any) => ({
          ...su,
          name: su.sites?.name || "",
          site_code: su.sites?.site_code || "",
          user_name: su.users?.name || "",
          employee_code: su.users?.employee_code || "",
          department: su.users?.department || "",
        }));
        setSiteUsers(flattenedData);
      }
    } catch (error) {
      console.error("Failed to fetch site users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await apiFetch("/api/sites?limit=500");
      const result = await res.json();
      if (result.success) {
        setSites(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch sites", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch("/api/users?limit=1000");
      const result = await res.json();
      if (result.success) {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const toggleUserSelection = (userId: string, checked: boolean) => {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  const handleAssign = async () => {
    if (!formData.site_id || selectedUserIds.length === 0) {
      alert("Please select a site and at least one user");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/site-users", {
        method: "POST",
        body: JSON.stringify({
          site_id: formData.site_id,
          user_ids: selectedUserIds,
          role_at_site: formData.role_at_site,
          is_primary: formData.is_primary,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (result.assigned === 0 && result.errors) {
          const errorMsgs = result.errors.map((e: any) => e.error).join(", ");
          alert(`Failed to assign users: ${errorMsgs}`);
        } else if (result.errors) {
          const errorMsgs = result.errors.map((e: any) => e.error).join(", ");
          alert(
            `${result.assigned} user(s) assigned, but some failed: ${errorMsgs}`
          );
          fetchSiteUsers();
          setIsAssignOpen(false);
          resetForm();
        } else {
          alert(`${result.assigned} user(s) assigned to site successfully`);
          fetchSiteUsers();
          setIsAssignOpen(false);
          resetForm();
        }
      } else {
        alert(result.error || "Failed to assign users");
      }
    } catch (error: any) {
      alert(error.message || "Failed to assign users");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      // 1. Get current assignments for this site to see what changed
      const currentAssignedIds = siteUsers
        .filter((su) => su.site_id === editingItem.site_id)
        .map((su) => su.user_id);

      // 2. Identify users to add and remove
      const toAdd = selectedUserIds.filter(
        (id) => !currentAssignedIds.includes(id)
      );
      const toRemove = currentAssignedIds.filter(
        (id) => !selectedUserIds.includes(id)
      );
      const toUpdate = currentAssignedIds.filter((id) =>
        selectedUserIds.includes(id)
      );

      const results = {
        added: 0,
        removed: 0,
        updated: 0,
        errors: [] as string[],
      };

      // Handle removals
      for (const userId of toRemove) {
        const res = await apiFetch(
          `/api/site-users/${editingItem.site_id}/${userId}`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        if (data.success) results.removed++;
        else results.errors.push(`Remove failed for ${userId}: ${data.error}`);
      }

      // Handle updates (existing ones that stayed selected)
      for (const userId of toUpdate) {
        const res = await apiFetch(
          `/api/site-users/${editingItem.site_id}/${userId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              role_at_site: formData.role_at_site,
              is_primary: formData.is_primary,
            }),
          }
        );
        const data = await res.json();
        if (data.success) results.updated++;
        else results.errors.push(`Update failed for ${userId}: ${data.error}`);
      }

      // Handle new assignments
      if (toAdd.length > 0) {
        const res = await apiFetch("/api/site-users", {
          method: "POST",
          body: JSON.stringify({
            site_id: editingItem.site_id,
            user_ids: toAdd,
            role_at_site: formData.role_at_site,
            is_primary: formData.is_primary,
          }),
        });
        const data = await res.json();
        if (data.success) results.added += data.assigned;
        if (data.errors)
          results.errors.push(...data.errors.map((e: any) => e.error));
      }

      const summary = [];
      if (results.added > 0) summary.push(`Added: ${results.added}`);
      if (results.removed > 0) summary.push(`Removed: ${results.removed}`);
      if (results.updated > 0) summary.push(`Updated: ${results.updated}`);

      if (results.errors.length > 0) {
        alert(`${summary.join(", ")} | Errors: ${results.errors.join(", ")}`);
      } else {
        alert(summary.length > 0 ? summary.join(", ") : "No changes made");
      }

      fetchSiteUsers();
      setIsEditOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error: any) {
      alert(error.message || "Failed to update assignments");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (siteId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this assignment?")) return;

    try {
      const res = await apiFetch(`/api/site-users/${siteId}/${userId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        alert("Assignment removed successfully");
        fetchSiteUsers();
      } else {
        alert(result.error || "Failed to remove assignment");
      }
    } catch (error: any) {
      alert(error.message || "Failed to remove assignment");
    }
  };

  const openEdit = (item: SiteUser) => {
    // When editing, we focus on the site and all users assigned to it
    const siteAssignedUserIds = siteUsers
      .filter((su) => su.site_id === item.site_id)
      .map((su) => su.user_id);

    setEditingItem(item);
    setFormData({
      site_id: item.site_id,
      role_at_site: item.role_at_site || "staff",
      is_primary: item.is_primary,
    });
    setSelectedUserIds(siteAssignedUserIds);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      site_id: "",
      role_at_site: "staff",
      is_primary: false,
    });
    setSelectedUserIds([]);
    setUserSearchTerm("");
    setSiteSearchTerm("");
  };

  const filteredSiteUsers = siteUsers.filter((su) => {
    const matchesSearch =
      searchTerm === "" ||
      su.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      su.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      su.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = siteFilter === "all" || su.site_id === siteFilter;
    return matchesSearch && matchesSite;
  });

  const filteredUsers = users.filter(
    (u) =>
      userSearchTerm === "" ||
      u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Modern Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Site Users
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage user assignments to operational sites.
          </p>
        </div>
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Assign Users
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Users to Site</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-tight">
                  1. Select Target Site
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search sites by name or code..."
                    className="pl-10 bg-zinc-50 border-zinc-200"
                    value={siteSearchTerm}
                    onChange={(e) => setSiteSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg bg-zinc-50/50">
                  {sites
                    .filter(
                      (s) =>
                        siteSearchTerm === "" ||
                        s.name
                          ?.toLowerCase()
                          .includes(siteSearchTerm.toLowerCase()) ||
                        s.site_code
                          ?.toLowerCase()
                          .includes(siteSearchTerm.toLowerCase())
                    )
                    .slice(0, 30)
                    .map((site) => (
                      <div
                        key={site.site_id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all border",
                          formData.site_id === site.site_id
                            ? "bg-red-50 border-red-200 shadow-sm"
                            : "bg-white border-zinc-200 hover:border-red-200"
                        )}
                        onClick={() =>
                          setFormData({ ...formData, site_id: site.site_id })
                        }
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                            formData.site_id === site.site_id
                              ? "border-red-600"
                              : "border-zinc-300"
                          )}
                        >
                          {formData.site_id === site.site_id && (
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-zinc-900">
                            {site.name}
                          </div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            {site.site_code}
                          </div>
                        </div>
                        {formData.site_id === site.site_id && (
                          <CheckCircle2 className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-tight flex items-center justify-between">
                  2. Select Employees to Assign
                  {selectedUserIds.length > 0 && (
                    <Badge className="bg-red-600 shadow-sm font-bold">
                      {selectedUserIds.length} SELECTED
                    </Badge>
                  )}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10 bg-zinc-50 border-zinc-200"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg bg-zinc-50/50">
                  {filteredUsers.slice(0, 50).map((user) => (
                    <div
                      key={user.user_id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all border",
                        selectedUserIds.includes(user.user_id)
                          ? "bg-red-50 border-red-200 shadow-sm"
                          : "bg-white border-zinc-200 hover:border-red-200"
                      )}
                      onClick={() =>
                        toggleUserSelection(
                          user.user_id,
                          !selectedUserIds.includes(user.user_id)
                        )
                      }
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.user_id)}
                        onCheckedChange={() => {}} // Controlled by parent div click
                        className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-zinc-900">
                          {user.name}
                        </div>
                        <div className="text-xs text-zinc-500 font-medium">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-tight">
                    Assignment Role
                  </label>
                  <Select
                    value={formData.role_at_site}
                    onValueChange={(v) =>
                      setFormData({ ...formData, role_at_site: v })
                    }
                  >
                    <SelectTrigger className="bg-white border-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col justify-end pb-1.5">
                  <div
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_primary: !formData.is_primary,
                      })
                    }
                  >
                    <Checkbox
                      id="is_primary"
                      checked={formData.is_primary}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_primary: !!checked })
                      }
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <label
                      htmlFor="is_primary"
                      className="text-sm font-bold text-zinc-700 uppercase tracking-tight cursor-pointer"
                    >
                      Primary Worksite
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button
                onClick={handleAssign}
                disabled={
                  isSubmitting ||
                  !formData.site_id ||
                  selectedUserIds.length === 0
                }
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-lg shadow-red-600/10"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Assign Selected Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Site Assignments</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-zinc-900 text-white rounded-xl flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">
                  {sites.find((s) => s.site_id === editingItem?.site_id)
                    ?.name || editingItem?.name}
                </div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {sites.find((s) => s.site_id === editingItem?.site_id)
                    ?.site_code || editingItem?.site_code}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-700 uppercase tracking-tight flex items-center justify-between">
                Manage Assigned Personnel
                {selectedUserIds.length > 0 && (
                  <Badge className="bg-red-600 shadow-sm font-bold">
                    {selectedUserIds.length} ASSIGNED
                  </Badge>
                )}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search and select users..."
                  className="pl-10 bg-zinc-50 border-zinc-200"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-1 border rounded-lg bg-zinc-50/50">
                {filteredUsers.slice(0, 100).map((user) => (
                  <div
                    key={user.user_id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all border",
                      selectedUserIds.includes(user.user_id)
                        ? "bg-red-50 border-red-200 shadow-sm"
                        : "bg-white border-zinc-200 hover:border-red-200"
                    )}
                    onClick={() =>
                      toggleUserSelection(
                        user.user_id,
                        !selectedUserIds.includes(user.user_id)
                      )
                    }
                  >
                    <Checkbox
                      checked={selectedUserIds.includes(user.user_id)}
                      onCheckedChange={() => {}}
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-zinc-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium">
                        {user.email} |{" "}
                        <span className="font-bold text-zinc-400 font-mono text-[10px]">
                          {user.employee_code || "NO CODE"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-tight">
                  Assignment Role
                </label>
                <Select
                  value={formData.role_at_site}
                  onValueChange={(v) =>
                    setFormData({ ...formData, role_at_site: v })
                  }
                >
                  <SelectTrigger className="bg-white border-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col justify-end pb-1.5">
                <div
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      is_primary: !formData.is_primary,
                    })
                  }
                >
                  <Checkbox
                    id="edit_is_primary"
                    checked={formData.is_primary}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_primary: !!checked })
                    }
                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label
                    htmlFor="edit_is_primary"
                    className="text-sm font-bold text-zinc-700 uppercase tracking-tight cursor-pointer"
                  >
                    Primary Worksite
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-lg shadow-red-600/10 font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              UPDATE ASSIGNMENTS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm shrink-0">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by name, site, or code..."
            className="pl-10 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-red-300 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Filter By Site
          </label>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-64 bg-zinc-50 border-zinc-200 font-bold text-xs uppercase tracking-tight">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL SITES</SelectItem>
              {sites.map((site) => (
                <SelectItem
                  key={site.site_id}
                  value={site.site_id}
                  className="text-xs font-bold uppercase"
                >
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 flex justify-end">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span className="text-zinc-900">{filteredSiteUsers.length}</span>{" "}
            Results
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="border-separate border-spacing-0">
            <TableHeader className="bg-zinc-50 sticky top-0 z-20">
              <TableRow>
                <TableHead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-900 py-4 px-6 border-b">
                  Personnel
                </TableHead>
                <TableHead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-900 py-4 px-6 border-b">
                  Assigned Site
                </TableHead>
                <TableHead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-900 py-4 px-6 border-b">
                  Site Role
                </TableHead>
                <TableHead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-900 py-4 px-6 border-b text-center">
                  Department
                </TableHead>
                <TableHead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-900 py-4 px-6 border-b text-center">
                  Primary
                </TableHead>
                <TableHead className="bg-zinc-50 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-900 py-4 px-6 border-b">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columnCount={6} rowCount={10} />
              ) : filteredSiteUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-24 text-zinc-400 font-bold uppercase text-[10px] tracking-widest"
                  >
                    No personnel-site assignments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSiteUsers.map((su) => (
                  <TableRow
                    key={`${su.site_id}-${su.user_id}`}
                    className="group hover:bg-zinc-50/50 transition-colors"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                          <User className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-sm tracking-tight">
                            {su.user_name}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                            {su.employee_code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                          <Building2 className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-sm tracking-tight">
                            {su.name}
                          </div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {su.site_code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge
                        variant="outline"
                        className="capitalize text-[10px] font-bold px-2 py-0 shadow-none bg-zinc-50 text-zinc-600 border-zinc-200"
                      >
                        {su.role_at_site || "staff"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center text-xs font-bold text-zinc-500 uppercase tracking-tighter">
                      {su.department || "N/A"}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      {su.is_primary ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                          <Star className="h-3 w-3 fill-amber-600 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">
                            PRIMARY
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-200">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-zinc-200/50"
                          onClick={() => openEdit(su)}
                        >
                          <Edit className="h-3.5 w-3.5 text-zinc-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemove(su.site_id, su.user_id)}
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

      <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
        <div>Site Access Management System</div>
        <div>
          Total Assignments:{" "}
          <span className="text-zinc-900">{siteUsers.length}</span>
        </div>
      </div>
    </div>
  );
}
