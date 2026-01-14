"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Access Denied</h1>
          <p className="text-zinc-600 mt-2">
            You don't have permission to access this application.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-red-800">
            <strong>Administrator Access Required</strong>
            <br />
            Only users with admin or superadmin privileges can access the
            SmartOps Admin panel.
          </p>
        </div>

        <Button
          onClick={() => router.push("/login")}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}
