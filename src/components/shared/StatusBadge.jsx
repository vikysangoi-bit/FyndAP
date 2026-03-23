import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  // Core
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  posted: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  on_hold: "bg-slate-100 text-slate-600 border-slate-200",
  // GRN / Inventory
  grn_draft: "bg-slate-100 text-slate-700 border-slate-200",
  grn_posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partially_received: "bg-blue-50 text-blue-700 border-blue-200",
  fully_received: "bg-emerald-50 text-emerald-700 border-emerald-200",
  // PO conversion
  not_converted: "bg-slate-100 text-slate-600 border-slate-200",
  partially_converted: "bg-amber-50 text-amber-700 border-amber-200",
  fully_converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  // Billing status
  unbilled: "bg-slate-100 text-slate-600 border-slate-200",
  partially_billed: "bg-amber-50 text-amber-700 border-amber-200",
  fully_billed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  // Three-way match
  unmatched: "bg-slate-100 text-slate-600 border-slate-200",
  two_way_matched: "bg-blue-50 text-blue-700 border-blue-200",
  three_way_matched: "bg-emerald-50 text-emerald-700 border-emerald-200",
  exception: "bg-rose-50 text-rose-700 border-rose-200",
  // AP Invoice
  rcm: "bg-purple-50 text-purple-700 border-purple-200",
  partially_paid: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  // GST 2B Recon
  matched: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mismatched: "bg-amber-50 text-amber-700 border-amber-200",
  missing_in_2b: "bg-rose-50 text-rose-700 border-rose-200",
  missing_in_books: "bg-blue-50 text-blue-700 border-blue-200",
  // Approvals
  escalated: "bg-orange-50 text-orange-700 border-orange-200",
  recalled: "bg-slate-100 text-slate-600 border-slate-200",
  // Payment
  executed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  bounced: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels = {
  draft: "Draft",
  pending: "Pending",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  posted: "Posted",
  completed: "Completed",
  active: "Active",
  inactive: "Inactive",
  cancelled: "Cancelled",
  on_hold: "On Hold",
  // GRN
  grn_draft: "Draft",
  grn_posted: "Posted",
  partially_received: "Partially Received",
  fully_received: "Fully Received",
  // PO conversion
  not_converted: "Not Converted",
  partially_converted: "Partially Converted",
  fully_converted: "Fully Converted",
  // Billing
  unbilled: "Unbilled",
  partially_billed: "Partially Billed",
  fully_billed: "Fully Billed",
  // Three-way match
  unmatched: "Unmatched",
  two_way_matched: "2-Way Match",
  three_way_matched: "3-Way Match",
  exception: "Exception",
  // AP Invoice
  rcm: "RCM",
  partially_paid: "Partially Paid",
  paid: "Paid",
  // GST 2B
  matched: "Matched",
  mismatched: "Mismatched",
  missing_in_2b: "Missing in 2B",
  missing_in_books: "Missing in Books",
  // Approvals
  escalated: "Escalated",
  recalled: "Recalled",
  // Payment
  executed: "Executed",
  bounced: "Bounced",
};

export default function StatusBadge({ status, className }) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border",
        statusStyles[status] || statusStyles.draft,
        className
      )}
    >
      {statusLabels[status] || status}
    </Badge>
  );
}