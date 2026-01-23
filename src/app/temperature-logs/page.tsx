import { SiteLogTable } from "@/components/site-log-table";

export default function TemperatureLogsPage() {
  const columns = [
    { key: "temperature", label: "Temperature (°C)", default: true },
    { key: "rh", label: "Humidity (%)", default: true },
  ];

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
      <SiteLogTable
        logType="Temp RH"
        columns={columns}
        title="Temperature Logs"
        description="Monitor site ambient temperature and humidity readings."
      />
    </div>
  );
}
