"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar as Sidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LogOut, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, token, isLoading } = useAuth();
  const isLoginPage = pathname === "/login";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 right-0 h-1 bg-red-100 overflow-hidden z-50">
          <div className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
        <style jsx global>{`
          @keyframes loading {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    );
  }

  if (isLoginPage || !token) {
    return <main>{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-zinc-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
          {/* Enterprise Header - Clean and Professional */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 sm:px-6 bg-white z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 h-9 w-9 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors rounded-lg" />
              <div className="h-5 w-px bg-zinc-200 mx-1" />
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight hidden sm:block">
                Smart Ops{" "}
                <span className="text-zinc-500 font-normal">Admin</span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-700">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-red-600">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="flex items-center gap-1.5">
                  {user?.name}
                  <span className="text-zinc-300">•</span>
                  <span className="text-zinc-900 uppercase tracking-wide font-semibold text-[10px]">
                    {user?.role}
                  </span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 font-medium transition-colors rounded-lg h-9"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden p-4 sm:p-6 bg-zinc-50">
            <div className="h-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
