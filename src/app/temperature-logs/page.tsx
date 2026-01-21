import { Construction } from "lucide-react";

export default function TemperatureLogsPage() {
  return (
    <div className="flex flex-col h-full p-4 sm:p-6 items-center justify-center text-zinc-500">
      <div className="bg-zinc-100 p-4 rounded-full mb-4">
        <Construction className="h-8 w-8 text-zinc-400" />
      </div>
      <h1 className="text-xl font-bold text-zinc-900 mb-2">Temperature Logs</h1>
      <p className="max-w-md text-center">
        This module is currently under development as part of the Phase 2
        Antigravity Plan. Detailed temperature logging and visualization will be
        available here soon.
      </p>
    </div>
  );
}
