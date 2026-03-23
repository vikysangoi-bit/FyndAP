import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { CheckCircle, XCircle, FileText, Package, Clock, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

const entityIcons = {
  journal_entry: FileText,
  inventory_transaction: Package,
};

export default function ApprovalCard({ request, onApprove, onReject, isLoading, onView, onEdit, onDelete }) {
  const Icon = entityIcons[request.entity_type] || FileText;
  
  return (
    <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-50">
          <Icon className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 truncate">{request.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{request.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(request)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(request)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(request)} className="text-rose-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
            <div>
              <span className="text-slate-400">Amount:</span>{' '}
              <span className="font-medium">{request.currency} {request.amount?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">Submitted by:</span>{' '}
              <span className="font-medium">{request.submitted_by_name || request.submitted_by}</span>
            </div>
            <div>
              <span className="text-slate-400">Date:</span>{' '}
              <span className="font-medium">{request.submitted_at ? format(new Date(request.submitted_at), 'MMM d, yyyy h:mm a') : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <Button 
          variant="outline" 
          onClick={() => onReject(request)}
          disabled={isLoading}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
        <Button 
          onClick={() => onApprove(request)}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
      </div>
    </Card>
  );
}