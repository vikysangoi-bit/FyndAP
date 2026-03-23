import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function UpdateStatusDialog({ open, onOpenChange, order, onUpdate, isLoading }) {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (newStatus) {
      onUpdate({ status: newStatus, reason });
      onOpenChange(false);
      setNewStatus('');
      setReason('');
    }
  };

  // Determine available status transitions based on current status
  const getAvailableStatuses = () => {
    if (!order) return [];
    
    switch (order.status) {
      case 'draft':
        return []; // Draft can't be updated directly
      case 'approved':
        return [
          { value: 'rejected', label: 'Rejected' },
          { value: 'signed', label: 'Signed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
      case 'signed':
        return [
          { value: 'cancelled', label: 'Cancelled' }
        ];
      case 'rejected':
        return [
          { value: 'cancelled', label: 'Cancelled' }
        ];
      default:
        return [];
    }
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="px-3 py-2 bg-slate-100 rounded-md text-sm font-medium capitalize">
              {order?.status?.replace('_', ' ')}
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(newStatus === 'rejected' || newStatus === 'cancelled') && (
            <div className="space-y-2">
              <Label>Reason {newStatus === 'rejected' ? '(Required)' : '(Optional)'}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason..."
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!newStatus || (newStatus === 'rejected' && !reason.trim()) || isLoading}
            className="bg-[#0f172a] hover:bg-[#1e3a5f]"
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}