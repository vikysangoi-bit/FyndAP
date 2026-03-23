import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

export default function DataTable({ 
  columns, 
  data, 
  isLoading, 
  onRowClick,
  emptyMessage = "No data available",
  enableRowSelection = false,
  selectedRows = [],
  onSelectionChange,
  visibleColumns = null
}) {
  const allSelected = enableRowSelection && data.length > 0 && selectedRows.length === data.length;
  const someSelected = enableRowSelection && selectedRows.length > 0 && selectedRows.length < data.length;

  // Filter and sort columns based on visibility
  const displayColumns = visibleColumns 
    ? visibleColumns
        .map(id => columns.find(col => col.id === id))
        .filter(Boolean)
    : columns;

  // Always ensure actions column is at the end if it exists
  const actionsColumn = columns.find(col => col.id === 'actions');
  if (actionsColumn && !displayColumns.find(col => col.id === 'actions')) {
    displayColumns.push(actionsColumn);
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange?.(data);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, row]);
    } else {
      onSelectionChange?.(selectedRows.filter(selected => selected.id !== row.id));
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
              <TableRow className="border-b border-slate-100">
                {enableRowSelection && <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>}
                {displayColumns.map((col, i) => (
                  <TableHead key={i} className="text-slate-600 font-semibold">
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {enableRowSelection && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                  {displayColumns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[calc(100vh-300px)] relative">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm shadow-sm">
            <TableRow className="border-b border-slate-100">
              {enableRowSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={someSelected ? "data-[state=checked]:bg-slate-400" : ""}
                  />
                </TableHead>
              )}
              {displayColumns.map((col, i) => (
                <TableHead key={col.id || i} className={`text-slate-600 font-semibold ${col.className || ''}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length + (enableRowSelection ? 1 : 0)} className="text-center py-12 text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow 
                  key={row.id || i} 
                  className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {enableRowSelection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.some(selected => selected.id === row.id)}
                        onCheckedChange={(checked) => handleSelectRow(row, checked)}
                        aria-label={`Select row ${i + 1}`}
                      />
                    </TableCell>
                  )}
                  {displayColumns.map((col, j) => (
                    <TableCell key={col.id || j} className={col.cellClassName || ''} onClick={() => onRowClick?.(row)}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}