import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FileText, Package, ArrowRightLeft, Upload } from "lucide-react";

const actions = [
  { label: "New Journal Entry", icon: FileText, page: "JournalEntries", color: "bg-blue-500" },
  { label: "Add Inventory Item", icon: Package, page: "Inventory", color: "bg-emerald-500" },
  { label: "Record Transaction", icon: ArrowRightLeft, page: "InventoryTransactions", color: "bg-violet-500" },
  { label: "Upload Document", icon: Upload, page: "Documents", color: "bg-amber-500" },
];

export default function QuickActions() {
  return (
    <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.label} to={createPageUrl(action.page)}>
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-slate-50 border-slate-200 hover:border-slate-300 transition-all"
            >
              <div className={`p-2 rounded-xl ${action.color}`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  );
}