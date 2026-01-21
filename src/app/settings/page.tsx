"use client";

import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Crown,
  History,
  Activity,
  Bell,
  MessageSquare,
  Settings as SettingsIcon,
} from "lucide-react";

const settingOptions = [
  {
    title: "User Management",
    href: "/users",
    icon: Users,
    desc: "Manage all registered system users, roles, and status.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Activity Logs",
    href: "/logs",
    icon: History,
    desc: "Comprehensive audit trail of all user actions and system events.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    desc: "Configure system alerts and push notification preferences.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "WhatsApp Config",
    href: "/whatsapp-settings",
    icon: MessageSquare,
    desc: "Manage API keys, message templates, and connection status.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "System Monitor",
    href: "/settings/monitoring",
    icon: Activity,
    desc: "Real-time server metrics, database status, and API health.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    title: "Admin Access",
    href: "/settings/admins",
    icon: ShieldCheck,
    desc: "Manage administrative privileges and staff roles.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Superadmin",
    href: "/settings/superadmin",
    icon: Crown,
    desc: "Critical system ownership and top-level security.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default function SettingsHub() {
  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col gap-2 border-b border-zinc-100 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
          System Administration
        </h1>
        <p className="text-zinc-500 text-lg">
          Centralized command center for managing operations, security, and
          communications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {settingOptions.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className="group relative flex flex-col p-8 bg-white border border-zinc-200 rounded-3xl hover:border-zinc-300 hover:shadow-2xl hover:shadow-zinc-200/50 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div
              className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
            >
              <item.icon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-900 group-hover:text-red-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                {item.desc}
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs font-bold text-zinc-400 group-hover:text-red-500 transition-colors uppercase tracking-widest">
              Manage Settings
              <svg
                className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Visual background element */}
      <div className="fixed top-0 right-0 -z-10 opacity-[0.03] pointer-events-none">
        <SettingsIcon size={600} />
      </div>
    </div>
  );
}
