import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({ 
  message = "Something went wrong", 
  description,
  onRetry,
  retryLabel = "Try again",
  className = "" 
}) {
  return (
    <Card className={`p-12 text-center bg-card ${className}`}>
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
      </div>
      <p className="text-xl text-foreground font-semibold mb-2">{message}</p>
      {description && (
        <p className="text-lg text-muted-foreground mb-6">{description}</p>
      )}
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </Card>
  );
}
