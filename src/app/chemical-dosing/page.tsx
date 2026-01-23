import { SiteLogTable } from "@/components/site-log-table";

export default function ChemicalDosingPage() {
  const columns = [
    { key: "chemical_dosing", label: "Dosing Details", default: true },
  ];

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
      <SiteLogTable
        logType="Chemical Dosing"
        columns={columns}
        title="Chemical Dosing"
        description="Track and review chemical dosing history across sites."
      />
    </div>
  );
}
