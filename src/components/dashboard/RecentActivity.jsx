import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, Package, CheckCircle, XCircle, Clock } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-rose-100 text-rose-700", icon: XCircle },
};

export default function RecentActivity({ items = [] }) {
  return (
    <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
        ) : (
          items.slice(0, 5).map((item, index) => {
            const config = statusConfig[item.status] || statusConfig.pending;
            return (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="p-2 rounded-xl bg-slate-100">
                  {item.entity_type === 'journal_entry' ? 
                    <FileText className="w-4 h-4 text-slate-600" /> : 
                    <Package className="w-4 h-4 text-slate-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.submitted_by_name || item.submitted_by} • {item.submitted_at ? format(new Date(item.submitted_at), 'MMM d, h:mm a') : 'N/A'}
                  </p>
                </div>
                <Badge className={`${config.color} border-0 text-xs font-medium`}>
                  {config.label}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}