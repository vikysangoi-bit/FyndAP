import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="p-4 rounded-2xl bg-slate-100 mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-6">{description}</p>
      {onAction && (
        <Button onClick={onAction} className="bg-[#0f172a] hover:bg-[#1e3a5f]">
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}