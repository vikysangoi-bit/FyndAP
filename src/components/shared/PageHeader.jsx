import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";

export default function PageHeader({ 
  title, 
  subtitle, 
  onAdd, 
  onExport, 
  onImport, 
  addLabel = "Add New",
  children 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {onExport && (
          <Button variant="outline" onClick={onExport} className="border-slate-200">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
        {onImport && (
          <Button variant="outline" onClick={onImport} className="border-slate-200">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        )}
        {onAdd && (
          <Button onClick={onAdd} className="bg-[#0f172a] hover:bg-[#1e3a5f]">
            <Plus className="w-4 h-4 mr-2" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}