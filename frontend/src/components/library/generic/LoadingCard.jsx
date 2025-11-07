import React from "react";
import { Card } from "@/components/ui/card";

export default function LoadingCard({ message = "Loading..." }) {
  return (
    <Card className="p-12 text-center bg-card">
      <p className="text-xl text-muted-foreground">{message}</p>
    </Card>
  );
}
