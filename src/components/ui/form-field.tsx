"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface FieldErrorType {
  message?: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  error?: FieldErrorType;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

/**
 * FormField wrapper with consistent styling and error display
 */
export function FormField({
  label,
  name,
  error,
  required,
  children,
  className,
  description,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={name}
        className={cn(
          "text-sm font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-1",
          error && "text-red-600",
        )}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-zinc-400">{description}</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{error.message}</span>
        </div>
      )}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldErrorType;
}

/**
 * Styled input with error state
 */
export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <Input
      className={cn(
        "bg-white border-zinc-200 transition-colors",
        error && "border-red-300 focus-visible:ring-red-500",
        className,
      )}
      {...props}
    />
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: FieldErrorType;
}

/**
 * Styled textarea with error state
 */
export function FormTextarea({
  error,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <Textarea
      className={cn(
        "bg-white border-zinc-200 transition-colors min-h-[100px]",
        error && "border-red-300 focus-visible:ring-red-500",
        className,
      )}
      {...props}
    />
  );
}

interface FormSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  error?: FieldErrorType;
  className?: string;
  disabled?: boolean;
}

/**
 * Styled select with error state
 */
export function FormSelect({
  value,
  onValueChange,
  placeholder,
  options,
  error,
  className,
  disabled,
}: FormSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-full bg-white border-zinc-200 transition-colors",
          error && "border-red-300 focus:ring-red-500",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
