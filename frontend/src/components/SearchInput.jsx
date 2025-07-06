import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchInput({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "",
  icon: IconComponent = Search
}) {
  return (
    <Card className={`bg-card p-6 ${className}`}>
      <div className="relative">
        <IconComponent className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pl-14 w-full bg-background text-foreground placeholder:text-muted-foreground h-14 text-lg"
        />
      </div>
    </Card>
  );
}
