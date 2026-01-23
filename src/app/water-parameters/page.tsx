import { SiteLogTable } from "@/components/site-log-table";

export default function WaterParametersPage() {
  const columns = [
    { key: "tds", label: "TDS (ppm)", default: true },
    { key: "ph", label: "pH", default: true },
    { key: "hardness", label: "Hardness", default: true },
  ];

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
      <SiteLogTable
        logType="Water"
        columns={columns}
        title="Water Parameters"
        description="Track water quality metrics including TDS, pH, and hardness."
      />
    </div>
  );
}
