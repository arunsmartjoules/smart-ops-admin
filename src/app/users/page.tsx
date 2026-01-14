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
        }`
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

    const headers = [
      "Employee Code",
      "Name",
      "Email",
      "Phone",
      "Role",
      "Site ID",
      "Site Code",
      "Designation",
      "Department",
      "Status",
      "DOB",
      "DOJ",
      "Supervisor",
      "Superadmin",
      "Work Location",
    ];

    const csvContent = [
      headers.join(","),
      ...users.map((u) =>
        [
          u.employee_code,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.site_id,
          u.site_code,
          u.designation,
          u.department,
          u.status,
          u.date_of_birth,
          u.date_of_joining,
          u.supervisor,
          u.is_superadmin,
          u.work_location_type,
        ]
          .map((v) => `"${v || ""}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().split("T")[0]}.csv`
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
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
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
    <div className="flex flex-col h-full space-y-6">
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
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="min-w-[2100px] border-separate border-spacing-0">
            <TableHeader className="bg-zinc-50 sticky top-0 z-30">
              <TableRow>
                <TableHead className="w-[48px] bg-zinc-50/80 backdrop-blur sticky top-0 left-0 z-40 shadow-sm border-b px-4">
                  <Checkbox
                    checked={
                      filteredUsers.length > 0 &&
                      selectedIds.length === filteredUsers.length
                    }
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="w-[120px] bg-zinc-50 sticky top-0 z-20 shadow-sm border-b">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                    onClick={() => handleSort("employee_code")}
                  >
                    Emp Code
                    {sortConfig?.key === "employee_code" ? (
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
                <TableHead className="min-w-[200px] bg-zinc-50 sticky top-0 z-20 shadow-sm border-b">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortConfig?.key === "name" ? (
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
                <TableHead className="min-w-[200px] bg-zinc-50 sticky top-0 z-20 shadow-sm border-b">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    {sortConfig?.key === "email" ? (
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
                <TableHead className="min-w-[120px] bg-zinc-50 sticky top-0 z-20 shadow-sm border-b">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                    onClick={() => handleSort("role")}
                  >
                    Role
                    {sortConfig?.key === "role" ? (
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
                <TableHead className="min-w-[150px] bg-zinc-50 sticky top-0 z-20 shadow-sm border-b">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                    onClick={() => handleSort("designation")}
                  >
                    Designation
                    {sortConfig?.key === "designation" ? (
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
                <TableHead className="min-w-[150px] bg-zinc-50 sticky top-0 z-20 shadow-sm border-b">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                    onClick={() => handleSort("department")}
                  >
                    Department
                    {sortConfig?.key === "department" ? (
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
                <TableHead className="min-w-[100px] bg-zinc-50 sticky top-0 z-20 shadow-sm border-b">
                  <button
                    className="flex items-center gap-1 hover:text-red-600 transition-colors uppercase text-[10px] font-bold tracking-wider text-zinc-900"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    {sortConfig?.key === "status" ? (
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
                <TableHead className="min-w-[150px] bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-20 shadow-sm border-b">
                  Phone
                </TableHead>
                <TableHead className="min-w-[150px] bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-20 shadow-sm border-b">
                  Site Code
                </TableHead>
                <TableHead className="min-w-[150px] bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-20 shadow-sm border-b">
                  Supervisor
                </TableHead>
                <TableHead className="min-w-[150px] bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-20 shadow-sm border-b">
                  Joined On
                </TableHead>
                <TableHead className="min-w-[120px] bg-zinc-50 text-zinc-900 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-20 shadow-sm border-b">
                  Work Location
                </TableHead>
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
                    <TableCell className="px-4 sticky left-0 z-10 bg-white group-hover:bg-zinc-50 transition-colors border-r border-zinc-100">
                      <Checkbox
                        checked={selectedIds.includes(user.user_id)}
                        onCheckedChange={(checked) =>
                          toggleSelect(user.user_id, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-[11px] font-bold text-zinc-400">
                      {user.employee_code || "N/A"}
                    </TableCell>
                    <TableCell className="font-bold text-zinc-900">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {user.is_superadmin && (
                          <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                        className={cn(
                          "text-[10px] font-bold uppercase px-2 shadow-none",
                          user.role === "admin"
                            ? "bg-red-600"
                            : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-zinc-600">
                      {user.designation || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-zinc-600">
                      {user.department || "-"}
                    </TableCell>
                    <TableCell>
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
                            : "text-zinc-600 bg-zinc-50"
                        )}
                      >
                        {user.status ||
                          (user.is_active ? "Active" : "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-500 font-medium">
                      {user.phone || user.mobile || "-"}
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-zinc-700">
                      {user.site_code || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 font-medium">
                      {user.supervisor || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 font-medium">
                      {user.date_of_joining
                        ? new Date(user.date_of_joining).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 font-medium">
                      {user.work_location_type || "-"}
                    </TableCell>
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
  const [formData, setFormData] = useState<any>(
    user || {
      name: "",
      email: "",
      employee_code: "",
      phone: "",
      role: "staff",
      designation: "",
      department: "",
      site_code: "",
      supervisor: "",
      date_of_joining: "",
      is_active: true,
      is_superadmin: false,
      status: "Active",
      work_location_type: "On-site",
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();
  const isSuperAdmin =
    currentUser?.is_superadmin ||
    currentUser?.email === "arun.kumar@smartjoules.in";

  const handleChange = (e: any) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const method = user ? "PUT" : "POST";
      const path = user ? `/api/users/${user.user_id}` : "/api/users";

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave();
      } else {
        const err = await res.json();
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
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Full Name
          </label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={handleChange}
            placeholder="John Doe"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="john@smartjoules.com"
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="employee_code"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            Employee Code
          </label>
          <Input
            id="employee_code"
            value={formData.employee_code || ""}
            onChange={handleChange}
            placeholder="SJ001"
            className="bg-white border-zinc-200"
          />
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
            value={formData.phone || formData.mobile || ""}
            onChange={handleChange}
            placeholder="+91 ..."
            className="bg-white border-zinc-200"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="role"
            className="text-sm font-bold text-zinc-700 uppercase tracking-tight"
          >
            System Role
          </label>
          <Select
            value={formData.role}
            onValueChange={(val) => setFormData({ ...formData, role: val })}
          >
            <SelectTrigger className="w-full bg-white border-zinc-200">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
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
            value={formData.designation || ""}
            onChange={handleChange}
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
            value={formData.department || ""}
            onChange={handleChange}
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
            value={formData.site_code || ""}
            onChange={handleChange}
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
            value={formData.supervisor || ""}
            onChange={handleChange}
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
                  !formData.date_of_joining && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date_of_joining ? (
                  format(new Date(formData.date_of_joining), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  formData.date_of_joining
                    ? new Date(formData.date_of_joining)
                    : undefined
                }
                onSelect={(date) =>
                  setFormData({
                    ...formData,
                    date_of_joining: date?.toISOString(),
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
            value={formData.work_location_type}
            onValueChange={(val) =>
              setFormData({ ...formData, work_location_type: val })
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
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100">
        <div className="flex items-center gap-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active !== false}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                is_active: !!checked,
                status: checked ? "Active" : "Inactive",
              })
            }
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
              checked={formData.is_superadmin === true}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_superadmin: !!checked })
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
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-lg shadow-red-600/10"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {user ? "Update Employee Profile" : "Create Employee Profile"}
        </Button>
      </DialogFooter>
    </div>
  );
}
