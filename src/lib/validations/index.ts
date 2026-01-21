/**
 * Centralized Zod Validation Schemas for Admin Portal Forms
 * Uses Zod v4 for type-safe form validation with react-hook-form
 */

import { z } from "zod";

// ============================================
// USER VALIDATION SCHEMA
// ============================================
export const userFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  platform_email: z
    .string()
    .email("Invalid platform email")
    .optional()
    .or(z.literal("")),
  employee_code: z
    .string()
    .min(1, "Employee code is required")
    .max(20, "Employee code must be less than 20 characters"),
  phone: z
    .string()
    .regex(
      /^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/,
      "Invalid phone number",
    )
    .optional()
    .or(z.literal("")),
  mobile: z
    .string()
    .regex(
      /^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/,
      "Invalid mobile number",
    )
    .optional()
    .or(z.literal("")),
  role: z.enum(["admin", "manager", "technician", "staff"], {
    message: "Please select a valid role",
  }),
  designation: z
    .string()
    .max(100, "Designation too long")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .max(100, "Department name too long")
    .optional()
    .or(z.literal("")),
  site_code: z
    .string()
    .max(20, "Site code too long")
    .optional()
    .or(z.literal("")),
  site_id: z.string().optional().or(z.literal("")),
  supervisor: z
    .string()
    .max(100, "Supervisor name too long")
    .optional()
    .or(z.literal("")),
  approving_authority: z.string().max(100).optional().or(z.literal("")),
  travel_approver: z.string().max(100).optional().or(z.literal("")),
  assigned_shift_code: z.string().max(10).optional().or(z.literal("")),
  date_of_joining: z.string().optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  is_superadmin: z.boolean().default(false),
  status: z.enum(["Active", "Inactive", "Pending"]).default("Active"),
  work_location_type: z.enum(["On-site", "Off-site", "WFH"]).default("On-site"),
  project_type: z.string().max(100).optional().or(z.literal("")),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

// ============================================
// SITE VALIDATION SCHEMA
// ============================================
export const siteFormSchema = z.object({
  site_id: z
    .string()
    .min(1, "Site ID is required")
    .max(50, "Site ID must be less than 50 characters"),
  site_name: z
    .string()
    .min(2, "Site name must be at least 2 characters")
    .max(200, "Site name must be less than 200 characters"),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  city: z.string().max(100, "City name too long").optional().or(z.literal("")),
  state: z
    .string()
    .max(100, "State name too long")
    .optional()
    .or(z.literal("")),
  country: z.string().max(100).default("India"),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")
    .optional()
    .or(z.literal("")),
  latitude: z
    .number()
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude")
    .optional()
    .or(z.literal(0)),
  longitude: z
    .number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude")
    .optional()
    .or(z.literal(0)),
  project_type: z.string().max(100).optional().or(z.literal("")),
  client: z
    .string()
    .max(200, "Client name too long")
    .optional()
    .or(z.literal("")),
  site_contact_number: z
    .string()
    .regex(
      /^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/,
      "Invalid contact number",
    )
    .optional()
    .or(z.literal("")),
  seo: z.string().max(100).optional().or(z.literal("")),
  rem: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive", "Maintenance"]).default("Active"),
  task_executor: z.string().max(100).optional().or(z.literal("")),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;

// ============================================
// TICKET VALIDATION SCHEMA
// ============================================
export const ticketFormSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  category: z.enum(
    ["HVAC", "Electrical", "Plumbing", "General", "IT", "Other"],
    {
      message: "Please select a category",
    },
  ),
  status: z
    .enum(["Open", "Inprogress", "Resolved", "Hold", "Waiting", "Cancelled"])
    .default("Open"),
  site_id: z.string().min(1, "Site is required"),
  location: z.string().max(200).optional().or(z.literal("")),
  area_asset: z.string().max(200).optional().or(z.literal("")),
  assigned_to: z.string().max(100).optional().or(z.literal("")),
  contact_name: z.string().max(100).optional().or(z.literal("")),
  contact_number: z
    .string()
    .regex(
      /^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/,
      "Invalid contact number",
    )
    .optional()
    .or(z.literal("")),
  current_temperature: z.number().min(-50).max(100).optional().nullable(),
  current_rh: z.number().min(0).max(100).optional().nullable(),
  standard_temperature: z.number().min(-50).max(100).optional().nullable(),
  standard_rh: z.number().min(0).max(100).optional().nullable(),
  spare_type: z.string().max(200).optional().or(z.literal("")),
  spare_quantity: z.number().min(0).optional().nullable(),
  escalation_source: z.string().max(100).optional().or(z.literal("")),
  internal_remarks: z.string().max(1000).optional().or(z.literal("")),
  customer_inputs: z.string().max(2000).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;

// ============================================
// ASSET VALIDATION SCHEMA
// ============================================
export const assetFormSchema = z.object({
  asset_name: z
    .string()
    .min(2, "Asset name must be at least 2 characters")
    .max(200, "Asset name must be less than 200 characters"),
  asset_type: z.string().min(1, "Asset type is required"),
  category: z.string().min(1, "Category is required"),
  site_id: z.string().min(1, "Site is required"),
  location: z.string().max(200).optional().or(z.literal("")),
  manufacturer: z.string().max(200).optional().or(z.literal("")),
  model: z.string().max(200).optional().or(z.literal("")),
  serial_number: z.string().max(100).optional().or(z.literal("")),
  purchase_date: z.string().optional().or(z.literal("")),
  warranty_expiry: z.string().optional().or(z.literal("")),
  status: z
    .enum(["Active", "Inactive", "Under Maintenance", "Decommissioned"])
    .default("Active"),
  condition: z.enum(["Excellent", "Good", "Fair", "Poor"]).optional(),
  capacity: z.string().max(100).optional().or(z.literal("")),
  power_rating: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

// ============================================
// PM CHECKLIST VALIDATION SCHEMA
// ============================================
export const pmChecklistFormSchema = z.object({
  checklist_name: z
    .string()
    .min(3, "Checklist name must be at least 3 characters")
    .max(200, "Checklist name must be less than 200 characters"),
  asset_type: z.string().min(1, "Asset type is required"),
  frequency: z.enum(["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"], {
    message: "Please select a frequency",
  }),
  description: z.string().max(1000).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  items: z
    .array(
      z.object({
        item_name: z.string().min(1, "Item name is required"),
        item_type: z
          .enum(["checkbox", "text", "number", "photo"])
          .default("checkbox"),
        is_required: z.boolean().default(false),
      }),
    )
    .optional(),
});

export type PMChecklistFormValues = z.infer<typeof pmChecklistFormSchema>;

// ============================================
// CHILLER READING VALIDATION SCHEMA
// ============================================
export const chillerReadingFormSchema = z.object({
  asset_id: z.string().min(1, "Asset is required"),
  reading_date: z.string().min(1, "Reading date is required"),
  evaporator_inlet_temp: z.number().optional().nullable(),
  evaporator_outlet_temp: z.number().optional().nullable(),
  condenser_inlet_temp: z.number().optional().nullable(),
  condenser_outlet_temp: z.number().optional().nullable(),
  chilled_water_flow: z.number().min(0).optional().nullable(),
  cooling_capacity_tr: z.number().min(0).optional().nullable(),
  power_consumption_kw: z.number().min(0).optional().nullable(),
  cop: z.number().min(0).max(10).optional().nullable(),
  compressor_amps: z.number().min(0).optional().nullable(),
  refrigerant_pressure_high: z.number().optional().nullable(),
  refrigerant_pressure_low: z.number().optional().nullable(),
  oil_level: z.enum(["Normal", "Low", "High"]).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  recorded_by: z.string().max(100).optional().or(z.literal("")),
});

export type ChillerReadingFormValues = z.infer<typeof chillerReadingFormSchema>;

// ============================================
// BULK EDIT SCHEMAS
// ============================================
export const bulkEditTicketSchema = z.object({
  status: z
    .enum(["Open", "Inprogress", "Resolved", "Hold", "Waiting", "Cancelled"])
    .optional(),
  assigned_to: z.string().max(100).optional().or(z.literal("")),
  internal_remarks: z.string().max(1000).optional().or(z.literal("")),
});

export type BulkEditTicketValues = z.infer<typeof bulkEditTicketSchema>;

// ============================================
// HELPER: Form Error Formatting
// ============================================
export function getFieldError(
  errors: Record<string, any>,
  fieldName: string,
): string | undefined {
  return errors?.[fieldName]?.message;
}

// ============================================
// HELPER: Default Values Generator
// ============================================
export const userFormDefaults: UserFormValues = {
  name: "",
  email: "",
  platform_email: "",
  employee_code: "",
  phone: "",
  mobile: "",
  role: "staff",
  designation: "",
  department: "",
  site_code: "",
  site_id: "",
  supervisor: "",
  approving_authority: "",
  travel_approver: "",
  assigned_shift_code: "",
  date_of_joining: "",
  date_of_birth: "",
  is_active: true,
  is_superadmin: false,
  status: "Active",
  work_location_type: "On-site",
  project_type: "",
};

export const ticketFormDefaults: Partial<TicketFormValues> = {
  title: "",
  category: "General",
  status: "Open",
  site_id: "",
  location: "",
  area_asset: "",
  assigned_to: "",
  contact_name: "",
  contact_number: "",
  internal_remarks: "",
  customer_inputs: "",
  notes: "",
};
