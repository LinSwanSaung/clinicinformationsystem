import React from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoadingState({ 
  message = "Loading...", 
  className = "",
  showSpinner = true 
}) {
  return (
    <Card className={`p-12 text-center bg-card ${className}`}>
      {showSpinner && (
        <div className="flex justify-center mb-4">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </div>
      )}
      <p className="text-xl text-muted-foreground">{message}</p>
    </Card>
  );
}
