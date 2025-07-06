import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FormField({
  type = "text",
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  className = "",
  error,
  disabled = false,
  rows = 3
}) {
  const handleChange = (e) => {
    const newValue = e.target ? e.target.value : e;
    onChange({ target: { name, value: newValue } });
  };

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            name={name}
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`bg-background text-foreground ${error ? 'border-destructive' : ''}`}
          />
        );
      
      case "select":
        return (
          <Select 
            value={value || ""} 
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={`bg-background text-foreground ${error ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            type={type}
            name={name}
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`bg-background text-foreground ${error ? 'border-destructive' : ''}`}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
