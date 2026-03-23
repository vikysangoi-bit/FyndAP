import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RefreshCw, Upload, Trash2, Download, Sheet } from "lucide-react";

export default function SyncDropdown({ 
  onBulkUpload, 
  onBulkDelete, 
  onGoogleSheetsImport, 
  onGoogleSheetsExport,
  onExportToExcel,
  className = "" 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`border-slate-200 ${className}`}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onBulkUpload}>
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload (CSV/Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onBulkDelete} className="text-rose-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Bulk Delete
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGoogleSheetsImport}>
          <Download className="w-4 h-4 mr-2" />
          Import from Google Sheets
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGoogleSheetsExport}>
          <Sheet className="w-4 h-4 mr-2" />
          Export to Google Sheets
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportToExcel}>
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}