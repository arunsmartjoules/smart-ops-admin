"use client";

import {
  LayoutDashboard,
  MapPin,
  Settings,
  UserCheck,
  Package,
  ClipboardCheck,
  ClipboardList,
  Thermometer,
  Ticket,
  Activity,
  Droplets,
  FlaskRound,
  Gauge,
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Organized navigation structure according to User Priority
const navigation = [
  {
    label: "Main",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
    collapsible: false,
  },
  {
    label: "Attendance",
    items: [
      { title: "Attendance Report", url: "/attendance-report", icon: Activity },
      { title: "Site Users", url: "/site-users", icon: UserCheck },
    ],
    collapsible: true,
  },
  {
    label: "Site Logs",
    items: [
      {
        title: "Temperature & RH",
        url: "/temperature-logs",
        icon: Thermometer,
      },
      { title: "Chiller Readings", url: "/chiller-readings", icon: Gauge },
      { title: "Water Parameters", url: "/water-parameters", icon: Droplets },
      { title: "Chemical Dosing", url: "/chemical-dosing", icon: FlaskRound },
    ],
    collapsible: true,
  },
  {
    label: "Tickets",
    items: [{ title: "Tickets", url: "/tickets", icon: Ticket }],
    collapsible: true,
  },
  {
    label: "Preventive Maintenance",
    items: [
      { title: "PM Checklists", url: "/pm-checklists", icon: ClipboardCheck },
      { title: "PM Instances", url: "/pm-instances", icon: ClipboardList },
    ],
    collapsible: true,
  },
  {
    label: "Facility Management",
    items: [
      { title: "Sites", url: "/sites", icon: MapPin },
      { title: "Assets", url: "/assets", icon: Package },
    ],
    collapsible: false,
  },
  {
    label: "System",
    items: [{ title: "Settings Hub", url: "/settings", icon: Settings }],
    collapsible: false,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarHeader className="h-16 border-b border-zinc-200 bg-white px-4">
        <div className="flex h-full items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-zinc-900">Smart Ops</span>
            <span className="text-[10px] font-medium uppercase text-zinc-500">
              Admin Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white px-3 py-4">
        {navigation.map((section) => (
          <SidebarGroup key={section.label}>
            {section.collapsible ? (
              <Collapsible defaultOpen={true} className="group/collapsible">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="px-2 mb-2 text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-600 cursor-pointer flex items-center justify-between w-full group/label">
                    <span>{section.label}</span>
                    <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {section.items.map((item) => {
                        const isActive =
                          pathname === item.url ||
                          (item.url !== "/" && pathname.startsWith(item.url));
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              tooltip={item.title}
                              className={`
                                h-10 px-3 rounded-lg font-medium text-sm transition-all
                                ${
                                  isActive
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "text-zinc-700 hover:bg-zinc-100"
                                }
                              `}
                            >
                              <Link
                                href={item.url}
                                className="flex items-center gap-3"
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="group-data-[collapsible=icon]:hidden">
                                  {item.title}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <SidebarGroupLabel className="px-2 mb-2 text-[10px] font-bold uppercase text-zinc-400">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.url ||
                        (item.url !== "/" && pathname.startsWith(item.url));
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            className={`
                              h-10 px-3 rounded-lg font-medium text-sm transition-all
                              ${
                                isActive
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "text-zinc-700 hover:bg-zinc-100"
                              }
                            `}
                          >
                            <Link
                              href={item.url}
                              className="flex items-center gap-3"
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="group-data-[collapsible=icon]:hidden">
                                {item.title}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
