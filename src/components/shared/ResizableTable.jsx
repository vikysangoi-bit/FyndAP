import React, { useState, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

export default function ResizableTable({ 
  columns, 
  data, 
  isLoading, 
  onRowClick,
  emptyMessage = "No data available",
  enableRowSelection = false,
  selectedRows = [],
  onSelectionChange,
  visibleColumns = null,
  storageKey = null
}) {
  const [columnWidths, setColumnWidths] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_widths`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [resizing, setResizing] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    if (storageKey && Object.keys(columnWidths).length > 0) {
      localStorage.setItem(`${storageKey}_widths`, JSON.stringify(columnWidths));
    }
  }, [columnWidths, storageKey]);

  const handleMouseDown = (e, columnId) => {
    e.preventDefault();
    setResizing({ columnId, startX: e.clientX, startWidth: columnWidths[columnId] || 150 });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizing) {
        const diff = e.clientX - resizing.startX;
        const newWidth = Math.max(80, resizing.startWidth + diff);
        setColumnWidths(prev => ({ ...prev, [resizing.columnId]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  const allSelected = enableRowSelection && data.length > 0 && selectedRows.length === data.length;
  const someSelected = enableRowSelection && selectedRows.length > 0 && selectedRows.length < data.length;

  const displayColumns = visibleColumns 
    ? visibleColumns
        .map(id => columns.find(col => col.id === id))
        .filter(Boolean)
    : columns;

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
      <div className="overflow-x-auto max-h-[calc(100vh-300px)] relative" ref={tableRef}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm shadow-sm">
            <TableRow className="border-b border-slate-100">
              {enableRowSelection && (
                <TableHead className="w-12 relative">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={someSelected ? "data-[state=checked]:bg-slate-400" : ""}
                  />
                </TableHead>
              )}
              {displayColumns.map((col, i) => (
                <TableHead 
                  key={col.id || i} 
                  className={`text-slate-600 font-semibold ${col.className || ''} relative`}
                  style={{ width: columnWidths[col.id] || 'auto', minWidth: columnWidths[col.id] || 'auto' }}
                >
                  {col.header}
                  {col.id && col.id !== 'actions' && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-0.5"
                      onMouseDown={(e) => handleMouseDown(e, col.id)}
                      style={{ 
                        userSelect: 'none',
                        touchAction: 'none'
                      }}
                    />
                  )}
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
                    <TableCell 
                      key={col.id || j} 
                      className={col.cellClassName || ''} 
                      onClick={() => onRowClick?.(row)}
                      style={{ width: columnWidths[col.id] || 'auto', minWidth: columnWidths[col.id] || 'auto' }}
                    >
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