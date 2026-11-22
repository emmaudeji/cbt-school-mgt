"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  label?: string;
  name: string;
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  isRequired?: boolean;
  error?: string;
  className?: string;
}

export function DateRangePicker({
  label,
  name,
  value,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  isRequired = false,
  error,
  className,
}: DateRangePickerProps) {
    const [range, setRange] = React.useState<DateRange | undefined>(value);

    React.useEffect(() => {
        setRange(value);
    }, [value]);

    const [open, setOpen] = React.useState(false);
    const [applied, setApplied] = React.useState(!!value?.from && !!value?.to);

    React.useEffect(() => {
    setRange(value);
    setApplied(!!value?.from && !!value?.to);
    }, [value]);

    const handleSelect = (selected: DateRange | undefined) => {
    setRange(selected);

    // user is editing again
    setApplied(false);
    };

    const handleSearch = () => {
    if (!range?.from || !range?.to) return;

    onChange(range);
    setApplied(true);
    setOpen(false);
    };

    const handleClear = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
    e.stopPropagation();

    setRange(undefined);
    setApplied(false);
    onChange(undefined);
    };

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={name} className="mb-1 block text-sm">
          {label}
          {isRequired && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}

    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
         <Button
            variant="outline"
            disabled={disabled}
            className={cn(
                "h-12 w-full justify-between px-4 font-normal",
                !range && "text-muted-foreground",
                className
            )}
            >
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <CalendarIcon className="h-4 w-4 shrink-0" />

                <span className="truncate">
                {range?.from ? (
                    range.to ? (
                    <>
                        {format(range.from, "MMM dd, yyyy")} —{" "}
                        {format(range.to, "MMM dd, yyyy")}
                    </>
                    ) : (
                    format(range.from, "MMM dd, yyyy")
                    )
                ) : (
                    placeholder
                )}
                </span>
            </div>

            {applied ? (
                <span
                    onClick={handleClear}
                    className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive transition hover:bg-destructive hover:text-white"
                >
                    <X className="h-4 w-4" />
                </span>
            ) : (
                <span
                    // arial-disabled={!range?.from || !range?.to}
                    onClick={(e) => {
                        if(!range?.from || !range?.to) return
                        e.stopPropagation();
                        handleSearch();
                    }}
                    className={cn(
                        "aria-disabled:cursor-not-allowed cursor-pointer",
                        "flex h-7 w-7 items-center justify-center rounded-full transition",
                        range?.from && range?.to
                        ? "bg-primary text-primary-foreground hover:scale-105"
                        : "bg-muted text-muted-foreground"
                    )}
                >
                    <Search className="h-4 w-4" />
                </span>
            )}
            </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto rounded-xl p-0 shadow-lg"
        >
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={range?.from}
            selected={range}
            onSelect={handleSelect}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>

      {error && (
        <p className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
 