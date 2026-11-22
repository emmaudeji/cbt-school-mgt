import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface OptionGroup {
  label: string;
  options: Option[];
}

interface CustomSelectProps {
  name: string;
  label?: string;
  options: Option[] | OptionGroup[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  description?: string;
  labelStyle?: string;
  // size?: "sm" | "default" ;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Select an option",
  required = false,
  className = "",
  triggerClassName = "",
  disabled = false,
  description,
  labelStyle,
  // size = "default",
}) => {

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div>
          <Label
            htmlFor={name}
            className={cn(
              "flex items-center gap-1 text-base",
              labelStyle
            )}
          >
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>

          {description && (
            <small className="text-foreground/50">
              {description}
            </small>
          )}
        </div>
      )}

      <Select
        onValueChange={(nextValue) => {
          if (nextValue !== null) onChange(nextValue);
        }}
        value={value}
        name={name}
        disabled={disabled}
        
      >
        <SelectTrigger
          // size={size}
          id={name}
          className={cn(
            "w-full",
            error && "border-red-500",
            triggerClassName
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option, index) => {
            if ("options" in option) {
              return (
                <SelectGroup key={index}>
                  <SelectLabel>{option.label}</SelectLabel>

                  {option.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            }

            return (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

export default CustomSelect;