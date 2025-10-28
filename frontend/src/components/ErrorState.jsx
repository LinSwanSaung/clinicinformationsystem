import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, AlertTriangle, Info } from "lucide-react";

/**
 * Enhanced Error State Component with multiple types and better UX
 */
export default function ErrorState({ 
  message = "Something went wrong", 
  description,
  onRetry,
  retryLabel = "Try again",
  type = "error", // "error", "warning", "info"
  className = "",
  showIcon = true,
  details = null // Additional technical details
}) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-16 w-16 text-yellow-500" />;
      case 'info':
        return <Info className="h-16 w-16 text-blue-500" />;
      default:
        return <AlertCircle className="h-16 w-16 text-destructive" />;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <Card className={`p-12 text-center ${getBgClass()} ${className}`}>
      {showIcon && (
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
      )}
      
      <p className="text-xl text-foreground font-semibold mb-2">{message}</p>
      
      {description && (
        <p className="text-lg text-muted-foreground mb-4">{description}</p>
      )}
      
      {details && (
        <div className="text-sm text-gray-600 mb-6 p-3 bg-gray-100 rounded-md text-left max-w-md mx-auto">
          <p className="font-medium mb-1">Technical Details:</p>
          <p className="font-mono text-xs">{details}</p>
        </div>
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
