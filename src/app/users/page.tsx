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
  ShieldCheck,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Calendar as CalendarIcon,
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
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";
import { ImportDialog } from "@/components/import-dialog";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set([
      "employee_code",
      "name",
      "email",
      "role",
      "designation",
      "department",
      "status",
      "phone",
      "site_code",
    ]),
  );

  const ALL_COLUMNS = [
    { key: "employee_code", label: "Emp Code" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "platform_email", label: "Platform Email" },
    { key: "role", label: "Role" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "status", label: "Status" },
    { key: "phone", label: "Phone" },
    { key: "mobile", label: "Mobile" },
    { key: "site_code", label: "Site Code" },
    { key: "site_id", label: "Site ID" },
    { key: "supervisor", label: "Supervisor" },
    { key: "approving_authority", label: "Approver" },
    { key: "travel_approver", label: "Travel Approver" },
    { key: "assigned_shift_code", label: "Shift" },
    { key: "date_of_joining", label: "Joined On" },
    { key: "date_of_birth", label: "DOB" },
    { key: "work_location_type", label: "Location" },
    { key: "project_type", label: "Project" },
    { key: "is_superadmin", label: "Superadmin" },
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

  const isSuperAdmin =
    currentUser?.is_superadmin ||
    currentUser?.email === "arun.kumar@smartjoules.in";

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(pagination.page, searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [pagination.page, searchTerm]);

  const fetchUsers = async (page: number, search: string = "") => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/users?page=${page}&limit=${pagination.limit}${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`,
      );
      const result = await res.json();
      if (result.success) {
        setUsers(result.data || []);
        if (result.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];

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
  }, [users, sortConfig]);

  const exportToCSV = () => {
    if (users.length === 0) return;

    const headers = ALL_COLUMNS.map((c) => c.label);

    const csvContent = [
      headers.join(","),
      ...users.map((u) =>
        ALL_COLUMNS.map((col) => {
          const val = u[col.key];
          return `"${val === null || val === undefined ? "" : val}"`;
        }).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredUsers.map((u) => u.user_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (userId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(`Are you sure you want to delete ${selectedIds.length} users?`)
    )
      return;

    setIsBulkDeleting(true);
    try {
      await apiFetch("/api/users/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      fetchUsers(pagination.page, searchTerm);
      alert("Successfully deleted users");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    try {
      await apiFetch("/api/users/bulk-update", {
        method: "POST",
        body: JSON.stringify({
          ids: selectedIds,
          updates: {
            is_active: isActive,
            status: isActive ? "Active" : "Inactive",
          },
        }),
      });
      setSelectedIds([]);
      fetchUsers(pagination.page, searchTerm);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 sm:p-6 pb-2">
      {/* Modern Header with Gradient Accent */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Users
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage system users, roles and comprehensive employee data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={loading || users.length === 0}
            className="border-zinc-300 hover:bg-zinc-100 hover:border-zinc-400 transition-all font-medium"
          >
            <Download className="mr-2 h-4 w-4 text-zinc-500" /> Export CSV
          </Button>

          <ImportDialog
            type="users"
            onSuccess={() => fetchUsers(pagination.page)}
          />

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

          {isSuperAdmin && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 transition-all">
                  <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <UserForm
                  onSave={() => {
                    setIsAddOpen(false);
                    fetchUsers(pagination.page);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Enhanced Search and Filters Bar */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by name, email, code or designation..."
              className="pl-10 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-red-300 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-zinc-200 hover:bg-zinc-100 shrink-0"
          >
            <Filter className="h-4 w-4 text-zinc-500" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <span>
            Showing <span className="text-zinc-900">{users.length}</span> of{" "}
            <span className="text-zinc-900">{pagination.total}</span> users
          </span>
          <div className="flex items-center gap-1 ml-4 border rounded-lg p-0.5 bg-zinc-50/50">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white hover:shadow-sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4 text-zinc-600" />
            </Button>
            <span className="px-3 font-bold text-zinc-700 text-xs">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white hover:shadow-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Table Container with Enhanced Styling */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table className="min-w-[2100px] border-separate border-spacing-0">
            <TableHeader className="bg-zinc-50 sticky top-0 z-30">
              <TableRow>
                <TableHead className="w-[48px] bg-zinc-50/80 backdrop-blur sticky top-0 left-0 z-40 shadow-sm border-b px-4 text-center">
                  <Checkbox
                    checked={
                      filteredUsers.length > 0 &&
                      selectedIds.length === filteredUsers.length
                    }
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
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
                <TableHead className="min-w-[80px] bg-zinc-50 text-right sticky right-0 top-0 z-30 shadow-sm border-b border-l uppercase text-[10px] font-bold tracking-wider text-zinc-900 px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableSkeleton columnCount={14} rowCount={10} />
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className="text-center py-20 text-muted-foreground font-medium"
                  >
                    No matching users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.user_id}
                    className={`hover:bg-zinc-50/50 transition-colors group ${
                      selectedIds.includes(user.user_id) ? "bg-red-50/30" : ""
                    }`}
                  >
                    <TableCell className="px-4 sticky left-0 z-10 bg-white group-hover:bg-zinc-50 transition-colors border-r border-zinc-100 text-center">
                      <Checkbox
                        checked={selectedIds.includes(user.user_id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(user.user_id, !!checked)
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
                                user.status === "Active" || user.is_active
                                  ? "text-green-600 bg-green-50"
                                  : user.status === "Inactive"
                                    ? "text-red-600 bg-red-50"
                                    : user.status === "Pending"
                                      ? "text-amber-600 bg-amber-50"
                                      : "text-zinc-600 bg-zinc-50",
                              )}
                            >
                              {user.status ||
                                (user.is_active ? "Active" : "Inactive")}
                            </Badge>
                          ) : col.key === "role" ? (
                            <Badge
                              variant={
                                user.role === "admin" ? "default" : "secondary"
                              }
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 shadow-none",
                                user.role === "admin"
                                  ? "bg-red-600"
                                  : "bg-zinc-100 text-zinc-600",
                              )}
                            >
                              {user.role}
                            </Badge>
                          ) : col.key === "name" ? (
                            <div className="flex items-center gap-2 font-bold text-zinc-900 whitespace-nowrap">
                              {user.name}
                              {user.is_superadmin && (
                                <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
                              )}
                            </div>
                          ) : col.key === "employee_code" ? (
                            <span className="font-mono text-[11px] font-bold text-zinc-400 whitespace-nowrap">
                              {user[col.key] || "N/A"}
                            </span>
                          ) : col.key.includes("date") ||
                            col.key === "created_at" ||
                            col.key === "updated_at" ? (
                            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                              {user[col.key]
                                ? format(
                                    new Date(user[col.key]),
                                    "MMM dd, yyyy",
                                  )
                                : "-"}
                            </span>
                          ) : col.key === "is_superadmin" ? (
                            user[col.key] ? (
                              <ShieldCheck className="h-4 w-4 text-red-600" />
                            ) : (
                              "-"
                            )
                          ) : (
                            <span className="text-xs text-zinc-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] block">
                              {user[col.key] || "-"}
                            </span>
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
                            Employee Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-zinc-400" />{" "}
                            Edit Details
                          </DropdownMenuItem>
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-bold text-red-600 cursor-pointer hover:bg-red-50 hover:text-red-700">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                User
                              </DropdownMenuItem>
                            </>
                          )}
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
          </DialogHeader>
          <UserForm
            user={selectedUser}
            onSave={() => {
              setIsEditOpen(false);
              fetchUsers(pagination.page);
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

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-300 hover:bg-zinc-800 hover:text-white font-bold text-xs"
              onClick={() => handleBulkStatusUpdate(true)}
            >
              MARK ACTIVE
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-300 hover:bg-zinc-800 hover:text-white font-bold text-xs"
              onClick={() => handleBulkStatusUpdate(false)}
            >
              MARK INACTIVE
            </Button>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
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
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-500 hover:text-white ml-2 transition-transform hover:rotate-90 active:scale-90"
            onClick={() => setSelectedIds([])}
          >
            <Plus className="h-5 w-5 rotate-45" />
          </Button>
        </div>
      )}
    </div>
  );
}

function UserForm({ user, onSave }: { user?: any; onSave: () => void }) {
  const { useForm } = require("react-hook-form");
  const { zodResolver } = require("@hookform/resolvers/zod");
  const { userFormSchema, userFormDefaults } = require("@/lib/validations");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: user || userFormDefaults,
    mode: "onBlur",
  });

  const { user: currentUser } = useAuth();
  const isSuperAdmin =
    currentUser?.is_superadmin ||
    currentUser?.email === "arun.kumar@smartjoules.in";

  const watchRole = watch("role");
  const watchIsActive = watch("is_active");
  const watchDateOfJoining = watch("date_of_joining");
  const watchDateOfBirth = watch("date_of_birth");
  const watchWorkLocationType = watch("work_location_type");

  const onSubmit = async (data: any) => {
    try {
      const method = user ? "PUT" : "POST";
      const path = user ? `/api/users/${user.user_id}` : "/api/users";

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(data),
      });

      if (res.ok) {
        onSave();
      } else {
        const err = await res.json();
        alert(err.error || "Operation failed");
      }
    } catch (error) {
      console.error("Save error", error);
    }
  };

  const FormFieldError = ({ name }: { name: string }) => {
    const error = errors[name];
    if (!error) return null;
    return (
      <div className="flex items-center gap-1.5 text-red-600 mt-1">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-medium">{error.message as string}</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className={cn(
              "text-sm font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-1",
              errors.name && "text-red-600",
            )}
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            {...register("name")}
            placeholder="John Doe"
            className={cn(
              "bg-white border-zinc-200",
              errors.name && "border-red-300 focus-visible:ring-red-500",
            )}
          />
          <FormFieldError name="name" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className={cn(
              "text-sm font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-1",
              errors.email && "text-red-600",
            )}
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="john@smartjoules.com"
            className={cn(
              "bg-white border-zinc-200",
              errors.email && "border-red-300 focus-visible:ring-red-500",
            )}
          />
          <FormFieldError name="email" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="employee_code"
            className={cn(
              "text-sm font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-1",
              errors.employee_code && "text-red-600",
            )}
          >
            Employee Code <span className="text-red-500">*</span>
          </label>
          <Input
            id="employee_code"
            {...register("employee_code")}
            placeholder="SJ001"
            className={cn(
              "bg-white border-zinc-200",
              errors.employee_code &&
                "border-red-300 focus-visible:ring-red-500",
            )}
          />
          <FormFieldError name="employee_code" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Phone / Mobile
          </label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="+91 ..."
            className={cn(
              "bg-white border-zinc-200",
              errors.phone && "border-red-300 focus-visible:ring-red-500",
            )}
          />
          <FormFieldError name="phone" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="role"
            className={cn(
              "text-sm font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-1",
              errors.role && "text-red-600",
            )}
          >
            System Role <span className="text-red-500">*</span>
          </label>
          <Select
            value={watchRole}
            onValueChange={(val) =>
              setValue("role", val, { shouldValidate: true })
            }
          >
            <SelectTrigger
              className={cn(
                "w-full bg-white border-zinc-200",
                errors.role && "border-red-300",
              )}
            >
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          <FormFieldError name="role" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="designation"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Designation
          </label>
          <Input
            id="designation"
            {...register("designation")}
            placeholder="Maintenance Engineer"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="department"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Department
          </label>
          <Input
            id="department"
            {...register("department")}
            placeholder="Operations"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="site_code"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Site Code
          </label>
          <Input
            id="site_code"
            {...register("site_code")}
            placeholder="DEL-HQ"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="supervisor"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Supervisor
          </label>
          <Input
            id="supervisor"
            {...register("supervisor")}
            placeholder="Manager Name"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="date_of_joining"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Date of Joining
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-white border-zinc-200",
                  !watchDateOfJoining && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watchDateOfJoining ? (
                  format(new Date(watchDateOfJoining), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  watchDateOfJoining ? new Date(watchDateOfJoining) : undefined
                }
                onSelect={(date) =>
                  setValue("date_of_joining", date?.toISOString() || "", {
                    shouldValidate: true,
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="work_location_type"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Work Location Type
          </label>
          <Select
            value={watchWorkLocationType}
            onValueChange={(val) =>
              setValue("work_location_type", val, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full bg-white border-zinc-200">
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="On-site">On-site</SelectItem>
              <SelectItem value="Off-site">Off-site</SelectItem>
              <SelectItem value="WFH">WFH</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="platform_email"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Platform Email
          </label>
          <Input
            id="platform_email"
            type="email"
            {...register("platform_email")}
            placeholder="platform@smartjoules.in"
            className={cn(
              "bg-white border-zinc-200",
              errors.platform_email && "border-red-300",
            )}
          />
          <FormFieldError name="platform_email" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="mobile"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Secondary Mobile
          </label>
          <Input
            id="mobile"
            {...register("mobile")}
            placeholder="+91 ..."
            className={cn(
              "bg-white border-zinc-200",
              errors.mobile && "border-red-300",
            )}
          />
          <FormFieldError name="mobile" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="site_id"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Site ID
          </label>
          <Input
            id="site_id"
            {...register("site_id")}
            placeholder="123"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="approving_authority"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Approving Authority
          </label>
          <Input
            id="approving_authority"
            {...register("approving_authority")}
            placeholder="Auth Name"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="travel_approver"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Travel Approver
          </label>
          <Input
            id="travel_approver"
            {...register("travel_approver")}
            placeholder="Approver Name"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="assigned_shift_code"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Assigned Shift Code
          </label>
          <Input
            id="assigned_shift_code"
            {...register("assigned_shift_code")}
            placeholder="GS / NS / ES"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="project_type"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Project Type
          </label>
          <Input
            id="project_type"
            {...register("project_type")}
            placeholder="JoulePura"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="date_of_birth"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Date of Birth
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-white border-zinc-200",
                  !watchDateOfBirth && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watchDateOfBirth ? (
                  format(new Date(watchDateOfBirth), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  watchDateOfBirth ? new Date(watchDateOfBirth) : undefined
                }
                onSelect={(date) =>
                  setValue("date_of_birth", date?.toISOString() || "", {
                    shouldValidate: true,
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100">
        <div className="flex items-center gap-2">
          <Checkbox
            id="is_active"
            checked={watchIsActive !== false}
            onCheckedChange={(checked) => {
              setValue("is_active", !!checked, { shouldValidate: true });
              setValue("status", checked ? "Active" : "Inactive", {
                shouldValidate: true,
              });
            }}
          />
          <label
            htmlFor="is_active"
            className="text-sm font-medium text-zinc-700 cursor-pointer"
          >
            User Account is Active
          </label>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_superadmin"
              checked={watch("is_superadmin") === true}
              onCheckedChange={(checked) =>
                setValue("is_superadmin", !!checked, { shouldValidate: true })
              }
            />
            <label
              htmlFor="is_superadmin"
              className="text-sm font-medium text-zinc-700 cursor-pointer flex items-center gap-1.5"
            >
              Grant Superadmin Privileges
              <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
            </label>
          </div>
        )}
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-lg shadow-red-600/10"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {user ? "Update Employee Profile" : "Create Employee Profile"}
        </Button>
      </DialogFooter>
    </form>
  );
}
