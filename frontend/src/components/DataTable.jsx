import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingCard from "./LoadingCard";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
  loadingMessage = "Loading...",
  onRowClick,
  actions,
  className = ""
}) {
  if (isLoading) {
    return <LoadingCard message={loadingMessage} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <Card className={`bg-card ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow 
              key={row.id || rowIndex}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={column.cellClassName}>
                  {column.render ? column.render(row) : row[column.accessor]}
                </TableCell>
              ))}
              {actions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant={action.variant || "outline"}
                        size={action.size || "sm"}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(row);
                        }}
                        className={action.className}
                      >
                        {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
