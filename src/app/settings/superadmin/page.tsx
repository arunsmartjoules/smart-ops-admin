"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Mail,
  Loader2,
  ShieldAlert,
  Crown,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function SuperadminPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangingSuperadmin, setIsChangingSuperadmin] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedNewSuperadmin, setSelectedNewSuperadmin] = useState("");

  useEffect(() => {
    fetchAdmins();
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

  const requestSuperadminChange = async () => {
    if (!selectedNewSuperadmin) {
      alert("Please select a new superadmin");
      return;
    }

    try {
      const res = await apiFetch("/api/admin/change-superadmin/request", {
        method: "POST",
        body: JSON.stringify({ newSuperadminUserId: selectedNewSuperadmin }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Verification code sent to your email");
        setIsChangingSuperadmin(true);
      } else {
        alert(result.error || "Failed to request superadmin change");
      }
    } catch (error: any) {
      alert(error.message || "Failed to request superadmin change");
    }
  };

  const verifySuperadminChange = async () => {
    if (!verificationCode) {
      alert("Please enter verification code");
      return;
    }

    try {
      const res = await apiFetch("/api/admin/change-superadmin/verify", {
        method: "POST",
        body: JSON.stringify({ code: verificationCode }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Superadmin changed successfully! Please log in again.");
        window.location.href = "/login";
      } else {
        alert(result.error || "Invalid verification code");
      }
    } catch (error: any) {
      alert(error.message || "Failed to verify superadmin change");
    }
  };

  const currentSuperadmin = admins.find((a) => a.is_superadmin);
  const eligibleAdmins = admins.filter(
    (a) => !a.is_superadmin && a.user_id !== currentUser?.id,
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Superadmin Controls
          </h1>
          <p className="text-zinc-500 mt-1">
            Critical system ownership transfer and top-level security.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 space-y-6 relative overflow-hidden group hover:border-red-200 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Crown className="w-24 h-24 text-red-600" />
            </div>

            <div className="flex items-center gap-3 relative">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                SUPERADMIN AUTHORITY
              </h2>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
                <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
                <span className="text-xs font-bold text-zinc-400 mt-4 uppercase tracking-widest">
                  Resolving hierarchy...
                </span>
              </div>
            ) : currentSuperadmin ? (
              <div className="space-y-6 relative">
                <div className="flex items-center gap-4 p-5 bg-red-50/50 rounded-2xl border border-red-100">
                  <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/20 border-4 border-white">
                    {currentSuperadmin.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-zinc-900 text-lg tracking-tight truncate">
                      {currentSuperadmin.name}
                    </div>
                    <div className="text-xs font-bold text-red-600 flex items-center gap-1 mt-0.5 truncate uppercase tracking-wider">
                      <Mail className="h-3 w-3" />
                      {currentSuperadmin.email}
                    </div>
                  </div>
                </div>

                {isSuperAdmin && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest py-6 rounded-xl shadow-xl shadow-zinc-900/10">
                        Transfer Ownership
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase">
                          <ShieldAlert className="h-6 w-6 text-red-600" />
                          Security Verification
                        </DialogTitle>
                      </DialogHeader>

                      {!isChangingSuperadmin ? (
                        <div className="space-y-6 py-4">
                          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <p className="text-xs font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                              Warning: This action will transfer full system
                              ownership to another administrator. You will lose
                              superadmin privileges.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                              Select Successor
                            </label>
                            <Select
                              value={selectedNewSuperadmin}
                              onValueChange={setSelectedNewSuperadmin}
                            >
                              <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200 font-bold">
                                <SelectValue placeholder="Choose secondary admin" />
                              </SelectTrigger>
                              <SelectContent>
                                {eligibleAdmins.map((admin) => (
                                  <SelectItem
                                    key={admin.user_id}
                                    value={admin.user_id}
                                    className="font-bold"
                                  >
                                    {admin.name} ({admin.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={requestSuperadminChange}
                            disabled={!selectedNewSuperadmin}
                            className="w-full bg-red-600 hover:bg-red-700 h-12 font-bold uppercase tracking-widest shadow-lg shadow-red-600/20"
                          >
                            Authenticate & Request Transfer
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6 py-4">
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center block w-full">
                              Verification Code Required
                            </label>
                            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <p className="text-xs font-bold text-green-700 uppercase tracking-tight">
                                A 6-digit secure code has been dispatched to
                                your email.
                              </p>
                            </div>
                            <Input
                              type="text"
                              placeholder="0 0 0 0 0 0"
                              className="h-16 text-center text-3xl font-black tracking-[1em] bg-zinc-50 border-zinc-200 focus:border-red-600 transition-all rounded-xl"
                              value={verificationCode}
                              onChange={(e) =>
                                setVerificationCode(e.target.value)
                              }
                              maxLength={6}
                            />
                          </div>
                          <Button
                            onClick={verifySuperadminChange}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 h-12 font-bold uppercase tracking-widest shadow-2xl shadow-zinc-900/20"
                          >
                            Execute Transfer Task
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400">
                No superadmin registered
              </div>
            )}
          </div>

          <div className="bg-zinc-900 rounded-2xl p-8 shadow-2xl shadow-zinc-900/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldAlert className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-white font-black uppercase text-sm tracking-widest mb-4">
              Security Protocol
            </h3>
            <p className="text-zinc-400 text-xs font-medium leading-relaxed">
              To maintain system integrity, only one{" "}
              <span className="text-red-500 font-bold underline decoration-red-500/30 underline-offset-4 uppercase">
                Superadmin
              </span>{" "}
              account is permitted globally. Administrative access is restricted
              to verified SJ personnel only.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                SYSTEM PROTECTED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
