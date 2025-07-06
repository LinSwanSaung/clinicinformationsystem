import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PageHeader({ 
  title, 
  subtitle, 
  actionButton,
  className = "",
  children
}) {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex gap-4">
        {actionButton && (
          <Link to={actionButton.href}>
            <Button className={`flex items-center gap-3 ${actionButton.className || 'bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 px-8'}`}>
              {actionButton.icon && <actionButton.icon className="h-6 w-6" />}
              {actionButton.label}
            </Button>
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
