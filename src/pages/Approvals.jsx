import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import ApprovalCard from "@/components/approval/ApprovalCard";
import EmptyState from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import SalesOrderForm from "@/components/salesorders/SalesOrderForm";

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [showSalesOrderForm, setShowSalesOrderForm] = useState(false);
  const [currentSalesOrder, setCurrentSalesOrder] = useState(null);
  const [viewModeSalesOrder, setViewModeSalesOrder] = useState(false);

  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['approval-requests'],
    queryFn: () => base44.entities.ApprovalRequest.list('-created_date')
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ['sales-orders-for-approval'],
    queryFn: () => base44.entities.SalesOrder.filter({ status: 'draft' })
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const approveMutation = useMutation({
    mutationFn: async (request) => {
      // Update approval request
      await base44.entities.ApprovalRequest.update(request.id, {
        status: 'approved',
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString()
      });
      
      // Update the original entity
      if (request.entity_type === 'journal_entry') {
        await base44.entities.JournalEntry.update(request.entity_id, {
          status: 'approved',
          approved_by: user?.email,
          approved_at: new Date().toISOString()
        });
      } else if (request.entity_type === 'inventory_transaction') {
        await base44.entities.InventoryTransaction.update(request.entity_id, {
          status: 'approved',
          approved_by: user?.email,
          approved_at: new Date().toISOString()
        });
      } else if (request.entity_type === 'purchase_order') {
        await base44.entities.PurchaseOrder.update(request.entity_id, {
          status: 'approved',
          approved_by: user?.email,
          approved_at: new Date().toISOString()
        });
      } else if (request.entity_type === 'sales_order') {
        await base44.entities.SalesOrder.update(request.entity_id, {
          status: 'approved',
          approved_by: user?.email,
          approved_at: new Date().toISOString()
        });
      } else if (request.entity_type === 'account_delete') {
        await base44.entities.Account.update(request.entity_id, {
          is_deleted: true,
          deleted_by: user?.email,
          deleted_on: new Date().toISOString()
        });
      } else if (request.entity_type === 'account_update') {
        // Update logic would require storing pending changes in the approval request
        alert('Account update approval - implement change application logic');
      }

      // Log audit
      await base44.entities.AuditLog.create({
        action: 'approve',
        entity_type: request.entity_type,
        entity_id: request.entity_id,
        entity_name: request.title,
        user_email: user?.email,
        user_name: user?.full_name,
        details: `Approved ${request.entity_type.replace(/_/g, ' ')}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-for-approval'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ request, reason }) => {
      // Update approval request
      await base44.entities.ApprovalRequest.update(request.id, {
        status: 'rejected',
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
        comments: reason
      });
      
      // Update the original entity
      if (request.entity_type === 'journal_entry') {
        await base44.entities.JournalEntry.update(request.entity_id, {
          status: 'rejected',
          approved_by: user?.email,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        });
      } else if (request.entity_type === 'inventory_transaction') {
        await base44.entities.InventoryTransaction.update(request.entity_id, {
          status: 'rejected',
          approved_by: user?.email,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        });
      } else if (request.entity_type === 'purchase_order') {
        await base44.entities.PurchaseOrder.update(request.entity_id, {
          status: 'rejected',
          approved_by: user?.email,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        });
      } else if (request.entity_type === 'sales_order') {
        await base44.entities.SalesOrder.update(request.entity_id, {
          status: 'rejected',
          approved_by: user?.email,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        });
      }

      // Log audit
      await base44.entities.AuditLog.create({
        action: 'reject',
        entity_type: request.entity_type,
        entity_id: request.entity_id,
        entity_name: request.title,
        user_email: user?.email,
        user_name: user?.full_name,
        details: `Rejected: ${reason}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-for-approval'] });
      setRejectDialog(null);
      setRejectReason('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ApprovalRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      setDeleteRequest(null);
    }
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const handleReject = (request) => {
    setRejectDialog(request);
  };

  const confirmReject = () => {
    if (rejectDialog) {
      rejectMutation.mutate({ request: rejectDialog, reason: rejectReason });
    }
  };

  const handleView = async (request) => {
    if (request.entity_type === 'sales_order') {
      const so = await base44.entities.SalesOrder.get(request.entity_id);
      setCurrentSalesOrder(so);
      setViewModeSalesOrder(true);
      setShowSalesOrderForm(true);
    } else {
      alert(`View functionality for ${request.entity_type} with ID: ${request.entity_id}`);
    }
  };

  const handleEdit = async (request) => {
    if (request.entity_type === 'sales_order') {
      const so = await base44.entities.SalesOrder.get(request.entity_id);
      setCurrentSalesOrder(so);
      setViewModeSalesOrder(false);
      setShowSalesOrderForm(true);
    } else {
      alert(`Edit functionality for ${request.entity_type} with ID: ${request.entity_id}`);
    }
  };

  const handleSaveSalesOrder = async (data) => {
    try {
      await base44.entities.SalesOrder.update(currentSalesOrder.id, data);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-for-approval'] });
      setShowSalesOrderForm(false);
      setCurrentSalesOrder(null);
    } catch (error) {
      console.error("Error saving sales order:", error);
      alert("Error saving sales order.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader 
          title="Approvals" 
          subtitle="Review and approve pending requests"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-white/80 border">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="All caught up!"
                description="No pending approvals at the moment."
              />
            ) : (
              pendingRequests.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={request}
                  onApprove={() => approveMutation.mutate(request)}
                  onReject={() => handleReject(request)}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setDeleteRequest}
                  isLoading={approveMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-6">
            {approvedRequests.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No approved requests"
                description="Approved requests will appear here."
              />
            ) : (
              approvedRequests.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={{ ...request, status: 'approved' }}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setDeleteRequest}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-6">
            {rejectedRequests.length === 0 ? (
              <EmptyState
                icon={XCircle}
                title="No rejected requests"
                description="Rejected requests will appear here."
              />
            ) : (
              rejectedRequests.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={{ ...request, status: 'rejected' }}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setDeleteRequest}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for rejection</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this request..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(null)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteRequest}
          onOpenChange={() => setDeleteRequest(null)}
          title="Delete Approval Request"
          description={`Are you sure you want to delete "${deleteRequest?.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteRequest.id)}
          variant="destructive"
        />

        {/* Sales Order Form */}
        <SalesOrderForm
          open={showSalesOrderForm}
          onOpenChange={(open) => {
            setShowSalesOrderForm(open);
            if (!open) {
              setCurrentSalesOrder(null);
              setViewModeSalesOrder(false);
            }
          }}
          order={currentSalesOrder}
          accounts={accounts}
          onSave={handleSaveSalesOrder}
          isLoading={false}
          viewMode={viewModeSalesOrder}
        />
      </div>
    </div>
  );
}