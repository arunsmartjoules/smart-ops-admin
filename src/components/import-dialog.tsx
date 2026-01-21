"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { importSchemas } from "@/lib/importSchemas";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ImportDialogProps {
  type: "users" | "assets" | "sites";
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function ImportDialog({ type, onSuccess, trigger }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    success: number;
    failed: number;
    errors?: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const schema = importSchemas[type];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadStats(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await apiFetch(`/api/import/${type}`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        setUploadStats(result.data);
        if (result.data.failed > 0) {
          toast.warning(`Import completed with ${result.data.failed} errors.`);
        } else {
          toast.success(
            `Import completed: ${result.data.success} records added.`,
          );
        }
        onSuccess();
      } else {
        setError(result.error || "Import failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Dynamically generate a CSV template based on schema
    const headers = schema.columns.map((c) => c.label).join(",");
    // Add a single dummy row for guidance
    const dummyRow = schema.columns
      .map((c) => {
        if (c.key === "role") return "technician";
        if (c.type === "date") return "2024-01-01";
        if (c.type === "number") return "123";
        return "example";
      })
      .join(",");

    const csvContent = `${headers}\n${dummyRow}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${type}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setUploadStats(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Import {schema.label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import {schema.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Supported Formats</h4>
              <p className="text-xs text-muted-foreground">
                You can upload <strong>.csv</strong> or <strong>.xlsx</strong>{" "}
                files. Ensure columns match the standard template.
              </p>
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-blue-600"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-1 h-3 w-3" /> Download Template
              </Button>
            </div>
          </div>

          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-muted rounded-full">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "CSV or Excel (max 10MB)"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadStats && (
            <div className="space-y-4">
              <Alert
                className={cn(
                  "border-green-200 bg-green-50 text-green-800",
                  uploadStats.failed > 0 &&
                    "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {uploadStats.failed === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {uploadStats.failed === 0
                    ? "Import Success"
                    : "Import Partial"}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Processed: {uploadStats.total} / Success:{" "}
                  {uploadStats.success} / Failed: {uploadStats.failed}
                </AlertDescription>
              </Alert>

              {uploadStats.errors && uploadStats.errors.length > 0 && (
                <div className="bg-zinc-50 border rounded-lg p-3 max-h-[150px] overflow-y-auto">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Error Log
                  </h5>
                  {uploadStats.errors.map((err, i) => (
                    <div
                      key={i}
                      className="text-[10px] py-1 border-b last:border-0 font-mono flex gap-2"
                    >
                      <span className="text-red-500 shrink-0">
                        Line {err.row}:
                      </span>
                      <span className="text-zinc-600 truncate">
                        {err.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-black text-white hover:bg-zinc-800"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Upload & Import"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
