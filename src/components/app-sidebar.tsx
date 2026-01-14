"use client";

import {
  LayoutDashboard,
  Users,
  MapPin,
  Settings,
  History,
  UserCheck,
  Building2,
  Activity,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Sites",
    url: "/sites",
    icon: MapPin,
  },
  {
    title: "Site Users",
    url: "/site-users",
    icon: UserCheck,
  },
  {
    title: "Audit Logs",
    url: "/logs",
    icon: History,
  },
  {
    title: "Attendance Report",
    url: "/attendance-report",
    icon: Activity,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-none">
      {/* Enterprise Header - Professional and Clean */}
      <SidebarHeader className="h-16 border-b border-zinc-200/80 bg-white px-4">
        <div className="flex h-full items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 shadow-sm group-data-[collapsible=icon]:mx-auto">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-zinc-900 tracking-tight">
              Smart Ops
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              Admin Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Enterprise Content - Clean White Background */}
      <SidebarContent className="bg-white px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={`
                        h-10 px-3 rounded-lg font-medium text-sm
                        transition-all duration-200 ease-out
                        group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2
                        ${
                          isActive
                            ? "bg-red-600 text-white shadow-sm hover:bg-red-700"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                        }
                      `}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon
                          className={`
                          h-4 w-4 shrink-0
                          ${isActive ? "text-white" : "text-zinc-600"}
                        `}
                        />
                        <span className="group-data-[collapsible=icon]:hidden truncate">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
