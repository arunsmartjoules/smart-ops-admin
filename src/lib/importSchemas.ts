export interface ImportSchemaColumn {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "date" | "enum";
  options?: string[]; // For enum type
  validation?: (value: any) => string | null; // Returns error message or null
}

export interface ImportSchema {
  id: string;
  label: string;
  columns: ImportSchemaColumn[];
  sampleFileUrl?: string; // URL to a sample CSV/XLSX
}

export const importSchemas: Record<string, ImportSchema> = {
  users: {
    id: "users",
    label: "Users",
    columns: [
      { key: "email", label: "Email", required: true, type: "string" },
      { key: "name", label: "Full Name", required: true, type: "string" },
      { key: "phone", label: "Phone Number", required: false, type: "string" },
      {
        key: "role",
        label: "Role",
        required: true,
        type: "enum",
        options: ["super_admin", "admin", "site_manager", "technician"],
      },
    ],
  },
  sites: {
    id: "sites",
    label: "Sites",
    columns: [
      { key: "name", label: "Site Name", required: true, type: "string" },
      { key: "location", label: "Location", required: true, type: "string" },
      {
        key: "client_name",
        label: "Client Name",
        required: true,
        type: "string",
      },
    ],
  },
  assets: {
    id: "assets",
    label: "Assets",
    columns: [
      { key: "name", label: "Asset Name", required: true, type: "string" },
      { key: "type", label: "Asset Type", required: true, type: "string" },
      {
        key: "serial_number",
        label: "Serial Number",
        required: false,
        type: "string",
      },
      { key: "site_name", label: "Site Name", required: true, type: "string" },
    ],
  },
};
