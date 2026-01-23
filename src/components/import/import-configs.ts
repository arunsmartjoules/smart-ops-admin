export interface ImportField {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "date" | "enum" | "reference";
  description?: string;
  example?: string;
  options?: string[]; // For enums
}

export interface ReportImportConfig {
  id: string;
  name: string;
  fields: ImportField[];
  targetTable: string;
}

export const IMPORT_CONFIGS: Record<string, ReportImportConfig> = {
  // --- Attendance ---
  attendance: {
    id: "attendance",
    name: "Attendance Import",
    targetTable: "attendance_logs",
    fields: [
      {
        key: "date",
        label: "Date",
        required: true,
        type: "date",
        example: "2024-01-01",
      },
      {
        key: "employee_code",
        label: "Employee Code / User ID",
        required: true,
        type: "reference",
        description: "Must match a user in the system",
      },
      {
        key: "site_code",
        label: "Site Code / Site ID",
        required: true,
        type: "reference",
        description: "Must match a site",
      },
      {
        key: "check_in_time",
        label: "Check In Time",
        required: true,
        type: "string",
        example: "09:00:00",
      },
      {
        key: "check_out_time",
        label: "Check Out Time",
        required: false,
        type: "string",
        example: "18:00:00",
      },
      {
        key: "status",
        label: "Status",
        required: false,
        type: "enum",
        options: ["Present", "Absent", "Leave", "Half Day"],
      },
      { key: "remarks", label: "Remarks", required: false, type: "string" },
    ],
  },

  // --- Tickets ---
  tickets: {
    id: "tickets",
    name: "Tickets Import",
    targetTable: "complaints",
    fields: [
      { key: "title", label: "Title", required: true, type: "string" },
      {
        key: "category",
        label: "Category",
        required: true,
        type: "enum",
        options: ["HVAC", "Electrical", "Plumbing", "IT", "Other"],
      },
      { key: "site_id", label: "Site ID", required: true, type: "reference" },
      {
        key: "priority",
        label: "Priority",
        required: false,
        type: "enum",
        options: ["Low", "Medium", "High", "Critical"],
      },
      {
        key: "status",
        label: "Status",
        required: false,
        type: "enum",
        options: ["Open", "In Progress", "Resolved", "Closed"],
      },
      {
        key: "assigned_to",
        label: "Assigned To (User ID)",
        required: false,
        type: "reference",
      },
      {
        key: "location",
        label: "Location within Site",
        required: false,
        type: "string",
      },
    ],
  },

  // --- Site Logs: Temp RH ---
  "site-logs-temp-rh": {
    id: "site-logs-temp-rh",
    name: "Temp & RH Import",
    targetTable: "site_logs",
    fields: [
      { key: "scheduled_date", label: "Date", required: true, type: "date" },
      { key: "site_id", label: "Site ID", required: true, type: "reference" },
      {
        key: "executor_id",
        label: "Technician ID",
        required: true,
        type: "reference",
      },
      {
        key: "temperature",
        label: "Temperature (°C)",
        required: true,
        type: "number",
      },
      { key: "rh", label: "Humidity (%)", required: true, type: "number" },
      {
        key: "entry_time",
        label: "Entry Time",
        required: false,
        type: "string",
      },
      { key: "remarks", label: "Remarks", required: false, type: "string" },
    ],
  },

  // --- Site Logs: Water ---
  "site-logs-water": {
    id: "site-logs-water",
    name: "Water Parameters Import",
    targetTable: "site_logs",
    fields: [
      { key: "scheduled_date", label: "Date", required: true, type: "date" },
      { key: "site_id", label: "Site ID", required: true, type: "reference" },
      {
        key: "executor_id",
        label: "Technician ID",
        required: true,
        type: "reference",
      },
      { key: "tds", label: "TDS", required: true, type: "number" },
      { key: "ph", label: "pH", required: true, type: "number" },
      { key: "hardness", label: "Hardness", required: true, type: "number" },
      { key: "remarks", label: "Remarks", required: false, type: "string" },
    ],
  },

  // --- Site Logs: Chemical ---
  "site-logs-chemical": {
    id: "site-logs-chemical",
    name: "Chemical Dosing Import",
    targetTable: "site_logs",
    fields: [
      { key: "scheduled_date", label: "Date", required: true, type: "date" },
      { key: "site_id", label: "Site ID", required: true, type: "reference" },
      {
        key: "executor_id",
        label: "Technician ID",
        required: true,
        type: "reference",
      },
      {
        key: "chemical_dosing",
        label: "Dosing Amount",
        required: true,
        type: "number",
      },
      { key: "remarks", label: "Remarks", required: false, type: "string" },
    ],
  },
};
