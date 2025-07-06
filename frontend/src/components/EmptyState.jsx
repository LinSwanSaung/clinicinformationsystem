import React from "react";
import { Card } from "@/components/ui/card";

export default function EmptyState({ 
  message = "No data found", 
  description,
  icon: IconComponent,
  className = "",
  children 
}) {
  return (
    <Card className={`p-12 text-center bg-card ${className}`}>
      {IconComponent && (
        <div className="flex justify-center mb-4">
          <IconComponent className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      <p className="text-xl text-muted-foreground">{message}</p>
      {description && (
        <p className="text-lg text-muted-foreground mt-2">{description}</p>
      )}
      {children}
    </Card>
  );
}
