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
import {
  ShieldCheck,
  UserPlus,
  UserMinus,
  Mail,
  Loader2,
  Search,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function AdminsPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  useEffect(() => {
    fetchAdmins();
    fetchAllUsers();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/list");
      const result = await res.json();
      if (result.success) {
        setAdmins(result.data || []);
      } else {
        const usersRes = await apiFetch("/api/users?limit=1000");
        const usersResult = await usersRes.json();
        if (usersResult.success) {
          const adminUsers = (usersResult.data || []).filter(
            (u: any) => u.role === "admin" || u.is_superadmin,
          );
          setAdmins(adminUsers);
        }
      }
    } catch (error) {
      console.error("Failed to fetch admins", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await apiFetch("/api/users?limit=1000");
      const result = await res.json();
      if (result.success) {
        const users = Array.isArray(result.data) ? result.data : [];
        setAllUsers(users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const res = await apiFetch("/api/admin/promote", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (result.success) {
        alert("User promoted to admin successfully");
        fetchAdmins();
        fetchAllUsers();
        setIsAddAdminOpen(false);
      } else {
        alert(result.error || "Failed to promote user");
      }
    } catch (error: any) {
      alert(error.message || "Failed to promote user");
    }
  };

  const demoteAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove admin privileges?")) return;

    try {
      const res = await apiFetch("/api/admin/demote", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Admin demoted successfully");
        fetchAdmins();
        fetchAllUsers();
      } else {
        alert(result.error || "Failed to demote admin");
      }
    } catch (error: any) {
      alert(error.message || "Failed to demote admin");
    }
  };

  const adminList = admins.filter((a) => !a.is_superadmin);
  const nonAdminUsers = allUsers.filter(
    (u) =>
      u.role !== "admin" &&
      !u.is_superadmin &&
      !admins.some((a) => a.user_id === u.user_id) &&
      !admins.some((a) => a.id === u.user_id),
  );

  return (
    <div className="flex flex-col h-full space-y-4 p-4 sm:p-6 pb-2">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Admin Access Management
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage administrative privileges and promote/demote staff.
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-widest h-10 px-6 rounded-lg shadow-lg shadow-red-600/10">
                <UserPlus className="mr-2 h-4 w-4" />
                Expand Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase">
                  <UserPlus className="h-6 w-6 text-red-600" />
                  Promote Staff to Admin
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Global Identity Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search SJ ID or Email..."
                      className="pl-10 h-12 bg-zinc-50 border-zinc-200 font-medium"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto border border-zinc-100 rounded-xl bg-zinc-50/30 p-1">
                  {nonAdminUsers
                    .filter(
                      (u) =>
                        userSearchTerm === "" ||
                        u.name
                          ?.toLowerCase()
                          .includes(userSearchTerm.toLowerCase()) ||
                        u.email
                          ?.toLowerCase()
                          .includes(userSearchTerm.toLowerCase()),
                    )
                    .slice(0, 50)
                    .map((user) => (
                      <div
                        key={user.user_id || user.id}
                        className="flex items-center justify-between p-4 hover:bg-white hover:shadow-sm rounded-lg cursor-pointer transition-all border border-transparent hover:border-zinc-200 group mb-1 last:mb-0"
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to promote ${user.name} to admin?`,
                            )
                          ) {
                            promoteToAdmin(user.user_id || user.id);
                            setUserSearchTerm("");
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 border border-zinc-200">
                            {user.name?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 text-sm tracking-tight">
                              {user.name}
                            </div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 font-bold text-[9px] uppercase tracking-widest text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          PROMOTE
                        </Button>
                      </div>
                    ))}
                  {nonAdminUsers.filter(
                    (u) =>
                      userSearchTerm === "" ||
                      u.name
                        ?.toLowerCase()
                        .includes(userSearchTerm.toLowerCase()) ||
                      u.email
                        ?.toLowerCase()
                        .includes(userSearchTerm.toLowerCase()),
                  ).length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-zinc-200" />
                      <div className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">
                        No matching personnel discovered
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-8 border-b bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              ADMINISTRATIVE PERSONNEL
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table className="border-separate border-spacing-0">
            <TableHeader className="bg-zinc-50/80 sticky top-0 z-10 backdrop-blur">
              <TableRow>
                <TableHead className="py-4 px-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b">
                  IDENTITY
                </TableHead>
                <TableHead className="py-4 px-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b">
                  COMMUNICATION
                </TableHead>
                <TableHead className="py-4 px-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b text-center">
                  AUTHORIZATION
                </TableHead>
                {isSuperAdmin && (
                  <TableHead className="py-4 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b">
                    RESTRICTION
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 4 : 3}
                    className="text-center py-32"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600 mb-4" />
                    <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">
                      Hydrating admin registry...
                    </span>
                  </TableCell>
                </TableRow>
              ) : adminList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 4 : 3}
                    className="text-center py-32 text-zinc-400 font-black uppercase text-[10px] tracking-widest"
                  >
                    Secondary admin registry is empty
                  </TableCell>
                </TableRow>
              ) : (
                adminList.map((admin) => (
                  <TableRow
                    key={admin.user_id || admin.id}
                    className="group hover:bg-zinc-50/50 transition-colors"
                  >
                    <TableCell className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-black border border-zinc-200 shadow-sm">
                          {admin.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="font-bold text-zinc-900 tracking-tight">
                          {admin.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                        <Mail className="h-3.5 w-3.5 text-zinc-300" />
                        {admin.email}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-widest px-3 border-none bg-emerald-50 text-emerald-600 shadow-none"
                      >
                        ACTIVE_ADMIN
                      </Badge>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="py-5 px-8 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => demoteAdmin(admin.user_id || admin.id)}
                          className="text-zinc-400 hover:text-red-600 hover:bg-red-50 font-bold text-[9px] uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"
                        >
                          <UserMinus className="h-3.5 w-3.5 mr-2" />
                          REVOKE ACCESS
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] flex items-center justify-between">
          <div>SJ Admin Panel Registry v2.0</div>
          <div className="flex items-center gap-4">
            <span>TOTAL: {admins.length}</span>
            <span>SESSION_SECURE: TRUE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
