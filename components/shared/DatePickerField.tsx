"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Field } from "./Field";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerFieldProps {
  label?: string;
  name: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
}

export const DatePickerField = ({
  label,
  name,
  value,
  onChange,
  error,
  required,
  description,
  disabled = false,
}: DatePickerFieldProps) => {
  const selectedDate = value && isValid(parseISO(value))
    ? parseISO(value)
    : undefined;

  const handleSelect = (date?: Date) => {
    if (date) onChange(format(date, "yyyy-MM-dd"));
  };

  return (
    <Field label={label} description={description} error={error} required={required} htmlFor={name}>
      <Popover>
        <div className="relative">
          <div className={cn("flex bg-background h-11 items-center gap-2 rounded-md border px-3 transition-all focus-within:border-primary", error && "border-destructive", disabled && "cursor-not-allowed opacity-60")}>
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />

            <Input
              id={name}
              type="text"
              placeholder="YYYY-MM-DD"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-auto border-none bg-transparent p-0 focus-visible:ring-0"
            />

            { !disabled && 
            <PopoverTrigger  disabled={disabled}>
              <div
                arial-disabled={disabled}
                aria-label="Open date picker"
                className="ml-auto text-muted-foreground transition hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <CalendarIcon className="size-4" />
              </div>
            </PopoverTrigger>}
          </div>

          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              captionLayout="dropdown"
              disabled={disabled}
              className="sm:w-72"
            />
          </PopoverContent>
        </div>
      </Popover>
    </Field>
  );
};