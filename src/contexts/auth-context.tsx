"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id?: string;
  is_superadmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleTokenExpired = () => {
      logout();
    };

    window.addEventListener("token-expired", handleTokenExpired);
    return () =>
      window.removeEventListener("token-expired", handleTokenExpired);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isSuperAdmin =
        user?.is_superadmin || user?.email === "arun.kumar@smartjoules.in";
      const isAdmin = user?.role === "admin" || isSuperAdmin;

      if (!token && pathname !== "/login") {
        router.push("/login");
      } else if (token && pathname === "/login") {
        router.push("/");
      } else if (token && !isAdmin && pathname !== "/unauthorized") {
        // Redirect non-admin users to unauthorized page
        router.push("/unauthorized");
      }
    }
  }, [token, pathname, isLoading, user, router]);

  const login = async (email: string, password: string) => {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.success) {
      const { token, user } = result.data;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      setToken(token);
      setUser(user);
      router.push("/");
    } else {
      throw new Error(result.error || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const isAdmin =
    user?.role === "admin" ||
    user?.is_superadmin ||
    user?.email === "arun.kumar@smartjoules.in" ||
    false;
  const isSuperAdmin =
    user?.is_superadmin || user?.email === "arun.kumar@smartjoules.in" || false;

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoading, isAdmin, isSuperAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
