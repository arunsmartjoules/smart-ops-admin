"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  X,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { IMPORT_CONFIGS, ReportImportConfig } from "./import-configs";
import { apiFetch, safeJsonParse } from "@/lib/api";
import { toast } from "sonner";

interface AdvancedImportWizardProps {
  configId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "upload" | "map" | "validate" | "result";

export function AdvancedImportWizard({
  configId,
  onClose,
  onSuccess,
}: AdvancedImportWizardProps) {
  const config = IMPORT_CONFIGS[configId];
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);

  // Mapping: { systemFieldKey: fileHeader }
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );

  // Validation
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    validRows: any[];
    invalidRows: any[];
    errors: string[];
  } | null>(null);

  // Commit
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!config) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Import configuration "{configId}" not found.
          </AlertDescription>
        </Alert>
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  // --- Step 1: Upload ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
          toast.error("File is empty or missing headers");
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = XLSX.utils.sheet_to_json(sheet); // Objects

        setFile(file);
        setFileHeaders(headers);
        setParsedData(rows);

        // Auto-map columns
        const autoMap: Record<string, string> = {};
        config.fields.forEach((field) => {
          // Case-insensitive match
          const match = headers.find(
            (h) =>
              h.toLowerCase() === field.key.toLowerCase() ||
              h.toLowerCase() === field.label.toLowerCase(),
          );
          if (match) autoMap[field.key] = match;
        });
        setColumnMapping(autoMap);

        setStep("map");
      } catch (error) {
        console.error(error);
        toast.error("Failed to parse file. Please verify format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- Step 2: Mapping ---
  const handleMappingChange = (systemKey: string, fileHeader: string) => {
    setColumnMapping((prev) => ({ ...prev, [systemKey]: fileHeader }));
  };

  const goToValidate = () => {
    // Check required fields
    const missing = config.fields
      .filter((f) => f.required && !columnMapping[f.key])
      .map((f) => f.label);

    if (missing.length > 0) {
      toast.error(`Missing required mappings: ${missing.join(", ")}`);
      return;
    }

    validateData();
  };

  // --- Step 3: Validation ---
  const validateData = async () => {
    setStep("validate");
    setValidating(true);

    // Transform data based on mapping
    const mappedRows = parsedData.map((row, idx) => {
      const mappedRow: any = { _rowIndex: idx + 2 }; // +2 for 1-based index + header
      Object.entries(columnMapping).forEach(([sysKey, fileHeader]) => {
        if (fileHeader) mappedRow[sysKey] = row[fileHeader];
      });
      return mappedRow;
    });

    try {
      const res = await apiFetch("/api/advanced-import/validate", {
        method: "POST",
        body: JSON.stringify({ type: config.id, rows: mappedRows }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await safeJsonParse(res);
      if (result.success) {
        setValidationResult(result.data);
      } else {
        toast.error(result.error || "Validation failed");
        setStep("map"); // Go back
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error during validation");
      setStep("map");
    } finally {
      setValidating(false);
    }
  };

  // --- Step 4: Commit ---
  const handleCommit = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setCommitting(true);

    try {
      const res = await apiFetch("/api/advanced-import/commit", {
        method: "POST",
        body: JSON.stringify({
          type: config.id,
          rows: validationResult.validRows,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await safeJsonParse(res);
      if (result.success) {
        setCommitResult(result.data);
        setStep("result");
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (error) {
      toast.error("Commit failed");
    } finally {
      setCommitting(false);
    }
  };

  // --- Renders ---

  const renderUpload = () => (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
      <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <FileSpreadsheet className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900">Upload Data File</h3>
      <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm">
        Drag and drop your Excel (XLSX) or CSV file here, or click to browse.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, .xlsx, .xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
        <Upload className="h-4 w-4" /> Select File
      </Button>
      <div className="mt-8 text-xs text-zinc-400">
        Supported formats: .xlsx, .csv
      </div>
    </div>
  );

  const renderMapping = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="font-semibold text-lg">Map Columns</h3>
          <p className="text-sm text-zinc-500">
            Match file columns to system fields.
          </p>
        </div>
        <Button onClick={goToValidate} className="gap-2">
          Next: Validate <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-lg overflow-auto flex-1 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">System Field</TableHead>
              <TableHead className="w-[10%] text-center">Required</TableHead>
              <TableHead className="w-[50%]">File Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.fields.map((field) => (
              <TableRow key={field.key}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">
                      {field.label}
                    </span>
                    {field.description && (
                      <span className="text-xs text-zinc-400">
                        {field.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {field.required && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      KEY
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={columnMapping[field.key] || ""}
                    onValueChange={(val) => handleMappingChange(field.key, val)}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        field.required &&
                          !columnMapping[field.key] &&
                          "border-red-300 bg-red-50/20",
                      )}
                    >
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fileHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderValidation = () => {
    if (validating) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <div className="relative mb-6">
            <ShieldCheck className="h-16 w-16 text-blue-100" />
            <Loader2 className="absolute inset-0 h-16 w-16 text-blue-600 animate-spin opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">
            Validating Data...
          </h3>
          <p className="text-zinc-500 max-w-sm mx-auto">
            Checking references, data types, and duplicates with the server.
          </p>
        </div>
      );
    }

    const {
      validRows = [],
      invalidRows = [],
      errors = [],
    } = validationResult || {};
    const isValid = invalidRows.length === 0 && validRows.length > 0;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
              isValid
                ? "bg-emerald-100 text-emerald-600"
                : "bg-amber-100 text-amber-600",
            )}
          >
            {isValid ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900">
              {isValid ? "Ready to Import" : "Issues Found"}
            </h3>
            <p className="text-sm text-zinc-500">
              {validRows.length} valid rows found. {invalidRows.length} invalid
              rows.
            </p>
          </div>
          {isValid && (
            <Button
              onClick={handleCommit}
              className="ml-auto gap-2"
              disabled={committing}
            >
              {committing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              Import {validRows.length} Rows
            </Button>
          )}
        </div>

        {errors.length > 0 && (
          <div className="mb-4 bg-red-50 p-4 rounded-lg border border-red-100 text-sm text-red-800">
            <strong>System Errors:</strong> {errors.join(", ")}
          </div>
        )}

        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invalidRows.map((row: any, i: number) => (
                <TableRow key={`inv-${i}`} className="bg-red-50/30">
                  <TableCell className="font-mono text-xs">
                    #{row._rowIndex}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-red-600 bg-white px-2 py-0.5 border border-red-100 rounded-full">
                      INVALID
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-red-700 font-medium">
                    {row._errors ? row._errors.join(", ") : "Unknown Error"}
                  </TableCell>
                </TableRow>
              ))}
              {validRows.slice(0, 10).map((row: any, i: number) => (
                <TableRow key={`val-${i}`}>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    #{row._rowIndex}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full">
                      VALID
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 italic">
                    Ready to import
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!isValid && invalidRows.length === 0 && validRows.length === 0 && (
          <div className="mt-4 text-center text-zinc-500">No data found.</div>
        )}
      </div>
    );
  };

  const renderResult = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">
        Import Successful!
      </h2>
      <p className="text-zinc-500 mb-8 max-w-sm">
        Successfully imported {commitResult?.success || 0} rows into{" "}
        {config.name}.
      </p>
      <Button onClick={onClose} size="lg" className="min-w-[150px]">
        Done
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <FileUp className="h-5 w-5 text-blue-600" />
              Advanced Import
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">{config.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-zinc-400" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-50 h-1">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
            style={{
              width:
                step === "upload"
                  ? "25%"
                  : step === "map"
                    ? "50%"
                    : step === "validate"
                      ? "75%"
                      : "100%",
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden bg-white/50 relative">
          {step === "upload" && renderUpload()}
          {step === "map" && renderMapping()}
          {step === "validate" && renderValidation()}
          {step === "result" && renderResult()}
        </div>
      </div>
    </div>
  );
}
