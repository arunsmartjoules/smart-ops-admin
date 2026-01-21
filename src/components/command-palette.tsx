"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Activity,
  LayoutDashboard,
  Settings,
  Users,
  MapPin,
  History,
  UserCheck,
  Package,
  ClipboardCheck,
  ClipboardList,
  Thermometer,
  Ticket,
  Bell,
  MessageSquare,
  Droplets,
  FlaskRound,
  Gauge,
} from "lucide-react";
import * as Icons from "lucide-react";

// Static list of pages for search
const pages = [
  { label: "Dashboard", url: "/", icon: "LayoutDashboard" },
  { label: "Tickets", url: "/tickets", icon: "Ticket" },
  { label: "Attendance Report", url: "/attendance-report", icon: "Activity" },
  { label: "Site Users", url: "/site-users", icon: "UserCheck" },
  { label: "Sites", url: "/sites", icon: "MapPin" },
  { label: "Assets", url: "/assets", icon: "Package" },
  { label: "PM Checklists", url: "/pm-checklists", icon: "ClipboardCheck" },
  { label: "PM Instances", url: "/pm-instances", icon: "ClipboardList" },
  { label: "Temperature & RH", url: "/temperature-logs", icon: "Thermometer" },
  { label: "Chiller Readings", url: "/chiller-readings", icon: "Gauge" },
  { label: "Water Parameters", url: "/water-parameters", icon: "Droplets" },
  { label: "Chemical Dosing", url: "/chemical-dosing", icon: "FlaskRound" },
  { label: "Activity Logs", url: "/logs", icon: "History" },
  { label: "Users", url: "/users", icon: "Users" },
  { label: "Notifications", url: "/notifications", icon: "Bell" },
  { label: "WhatsApp Settings", url: "/whatsapp-settings", icon: "MessageSquare" },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const [recentSearches, setRecentSearches] = React.useState<
    { label: string; url: string; iconName: string }[]
  >([]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const stored = localStorage.getItem("command-recent");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const addToRecent = (label: string, url: string, iconName: string) => {
    const newItem = { label, url, iconName };
    const maxItems = 5;
    const updated = [
      newItem,
      ...recentSearches.filter((item) => item.label !== label),
    ].slice(0, maxItems);
    setRecentSearches(updated);
    localStorage.setItem("command-recent", JSON.stringify(updated));
  };

  const runCommand = React.useCallback(
    (
      action: () => unknown,
      meta?: { label: string; url: string; iconName: string },
    ) => {
      setOpen(false);
      if (meta) {
        addToRecent(meta.label, meta.url, meta.iconName);
      }
      action();
    },
    [recentSearches],
  );

  const getIcon = (name: string) => {
    const Icon = (Icons as any)[name];
    return Icon || LayoutDashboard;
  };

  const filteredSuggestions = React.useMemo(() => {
    const recentUrls = new Set(recentSearches.map((r) => r.url));
    return pages
      .filter((page) => !recentUrls.has(page.url))
      .slice(0, 10);
  }, [recentSearches]);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground border rounded-md cursor-pointer hover:bg-zinc-100 hover:text-foreground transition-colors mr-4 bg-zinc-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-medium">Search commands...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {recentSearches.length > 0 && (
            <CommandGroup heading="Recent">
              {recentSearches.map((item) => {
                const Icon = getIcon(item.iconName);
                return (
                  <CommandItem
                    key={item.url}
                    onSelect={() => runCommand(() => router.push(item.url))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {recentSearches.length > 0 && <CommandSeparator />}

          {filteredSuggestions.length > 0 && (
            <CommandGroup heading="Suggestions">
              {filteredSuggestions.map((page) => {
                const Icon = getIcon(page.icon);
                return (
                  <CommandItem
                    key={page.url}
                    onSelect={() =>
                      runCommand(() => router.push(page.url), {
                        label: page.label,
                        url: page.url,
                        iconName: page.icon,
                      })
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{page.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/settings"), {
                  label: "General Settings",
                  url: "/settings",
                  iconName: "Settings",
                })
              }
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>General Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/settings/monitoring"), {
                  label: "System Monitor",
                  url: "/settings/monitoring",
                  iconName: "Activity",
                })
              }
            >
              <Activity className="mr-2 h-4 w-4" />
              <span>System Monitor</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
