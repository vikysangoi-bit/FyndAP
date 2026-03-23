import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import PurchaseOrderForm from "@/components/purchaseorders/PurchaseOrderForm";
import GoodsReceiptForm from "@/components/purchaseorders/GoodsReceiptForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import BulkDeleteDialog from "@/components/shared/BulkDeleteDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import ColumnSelector from "@/components/shared/ColumnSelector";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, FileText, Send, Eye, Package, CheckCircle, Upload, Mail } from "lucide-react";
import { format } from "date-fns";

const STORAGE_KEY = 'purchaseOrders_visibleColumns';

export default function PurchaseOrders() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [deletePO, setDeletePO] = useState(null);
  const [viewPO, setViewPO] = useState(null);
  const [receivingPO, setReceivingPO] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.list('-created_date')
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PurchaseOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PurchaseOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setShowForm(false);
      setEditingPO(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PurchaseOrder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setDeletePO(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      await Promise.all(rows.map(row => base44.entities.PurchaseOrder.delete(row.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const submitForApproval = async (po) => {
    await base44.entities.PurchaseOrder.update(po.id, {
      status: 'pending_approval',
      submitted_by: user?.email,
      submitted_at: new Date().toISOString()
    });
    
    await base44.entities.ApprovalRequest.create({
      entity_type: 'purchase_order',
      entity_id: po.id,
      title: `Purchase Order: ${po.po_number}`,
      description: `PO for ${po.supplier_name} - ${po.items?.length || 0} items`,
      amount: po.total_amount,
      currency: po.currency,
      status: 'pending',
      submitted_by: user?.email,
      submitted_by_name: user?.full_name,
      submitted_at: new Date().toISOString()
    });
    
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
  };

  const sendEmailDraft = async (po) => {
    try {
      // Build detailed PO content
      const itemsTable = po.items?.map((item, i) => 
        `${i + 1}. ${item.description || item.styleID} - Qty: ${item.quantity} @ ${po.currency} ${item.rate_per_unit?.toFixed(2)} = ${po.currency} ${item.gross_value?.toFixed(2)}`
      ).join('\n') || 'No items';

      const emailBody = `
        <h2>Purchase Order: ${po.po_number}</h2>
        <p><strong>Date:</strong> ${po.po_date || 'N/A'}</p>
        <p><strong>Supplier:</strong> ${po.supplier_name} (${po.supplier_code})</p>
        <p><strong>Delivery Date:</strong> ${po.delivery_date || 'N/A'}</p>
        <p><strong>Shipping Terms:</strong> ${po.shipping_terms || 'N/A'}</p>
        <p><strong>Payment Terms:</strong> ${po.payment_terms || 'N/A'}</p>
        
        <h3>Items:</h3>
        <pre>${itemsTable}</pre>
        
        <h3>Totals:</h3>
        <p><strong>Subtotal:</strong> ${po.currency} ${(po.subtotal || 0).toFixed(2)}</p>
        <p><strong>Tax:</strong> ${po.currency} ${(po.tax_amount || 0).toFixed(2)}</p>
        <p><strong>Shipping:</strong> ${po.currency} ${(po.shipping_cost || 0).toFixed(2)}</p>
        <p><strong>Total Amount:</strong> ${po.currency} ${(po.total_amount || 0).toFixed(2)}</p>
        
        ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}
        
        <p>Best regards,</p>
      `.trim();

      // Create Gmail draft without PDF
      const result = await base44.functions.invoke('createGmailDraft', {
        to: '',
        subject: `Purchase Order ${po.po_number} - ${po.supplier_name}`,
        body: emailBody,
        pdfUrl: 'https://placeholder.com/dummy.pdf'
      });

      alert('Gmail draft created successfully! Please check your Gmail drafts.');
    } catch (error) {
      console.error('Error creating draft:', error);
      alert(`Error creating draft: ${error.message}`);
    }
  };

  const filteredPOs = pos.filter(po => {
    const matchesSearch = 
      po.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generatePONumber = () => {
    const count = pos.length + 1;
    return `PO-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
  };

  const allColumns = [
    { 
      id: "po_number",
      header: "PO Number", 
      render: (row) => <span className="font-mono font-medium text-slate-900">{row.po_number || '-'}</span>
    },
    { 
      id: "po_date",
      header: "Date", 
      render: (row) => row.po_date ? format(new Date(row.po_date), 'MMM d, yyyy') : '-'
    },
    { 
      id: "supplier",
      header: "Supplier", 
      render: (row) => (
        <div>
          <span className="font-medium text-slate-900">{row.supplier_name}</span>
          <p className="text-xs text-slate-500">{row.supplier_code}</p>
        </div>
      )
    },
    { 
      id: "items",
      header: "Items", 
      render: (row) => (
        <Badge variant="outline">{row.items?.length || 0} items</Badge>
      )
    },
    { 
      id: "total_amount",
      header: "Total Amount", 
      render: (row) => (
        <span className="font-medium">
          {row.currency} {(row.total_amount || 0).toFixed(2)}
        </span>
      )
    },
    { 
      id: "delivery_date",
      header: "Delivery Date", 
      render: (row) => row.delivery_date ? format(new Date(row.delivery_date), 'MMM d, yyyy') : '-'
    },
    { 
      id: "status",
      header: "Status", 
      render: (row) => <StatusBadge status={row.status || 'draft'} />
    },
    {
      id: "actions",
      header: "",
      cellClassName: "text-right",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewPO(row)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {row.status === 'draft' && (
              <>
                <DropdownMenuItem onClick={() => { setEditingPO(row); setShowForm(true); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => submitForApproval(row)}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Approval
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeletePO(row)} className="text-rose-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {(row.status === 'approved' || row.status === 'partially_received') && (
              <DropdownMenuItem onClick={() => setReceivingPO(row)}>
                <Package className="w-4 h-4 mr-2" />
                Receive Goods
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => sendEmailDraft(row)}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedColumns = saved ? JSON.parse(saved) : allColumns.map(c => c.id);
    if (!savedColumns.includes('actions')) savedColumns.push('actions');
    return savedColumns;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const totalValue = filteredPOs.reduce((sum, po) => {
    const value = po.total_amount || 0;
    const inr = po.currency === 'USD' ? value * 90 : value;
    return sum + inr;
  }, 0);

  const handleSave = (data) => {
    if (editingPO) {
      updateMutation.mutate({ id: editingPO.id, data });
    } else {
      createMutation.mutate({ 
        ...data, 
        po_number: generatePONumber(), 
        status: 'draft' 
      });
    }
  };

  const handleReceiveGoods = async (receiptData) => {
    // Create goods receipt
    const receipt = await base44.entities.GoodsReceipt.create({
      ...receiptData,
      receipt_number: `GR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      status: 'completed',
      received_by: user?.email
    });

    // Update inventory for each item
    for (const item of receiptData.items) {
      if (item.received_quantity > 0) {
        // Create inventory transaction
        await base44.entities.InventoryTransaction.create({
          transaction_number: `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
          transaction_date: receiptData.receipt_date,
          type: 'receipt',
          item_id: item.item_id,
          item_sku: item.item_sku,
          item_name: item.item_name,
          quantity: item.received_quantity,
          unit_cost: item.unit_price,
          total_cost: item.total,
          currency: receiptData.currency,
          reference: receiptData.po_number,
          to_location: item.warehouse_location,
          reason: `Goods receipt from PO ${receiptData.po_number}`,
          status: 'completed'
        });

        // Update inventory item quantity
        const invItem = await base44.entities.InventoryItem.filter({ id: item.item_id });
        if (invItem.length > 0) {
          await base44.entities.InventoryItem.update(item.item_id, {
            quantity_on_hand: invItem[0].quantity_on_hand + item.received_quantity,
            total_value: (invItem[0].quantity_on_hand + item.received_quantity) * invItem[0].unit_cost
          });
        }
      }
    }

    // Update PO status and received quantities
    const totalOrdered = receivingPO.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = receivingPO.items.reduce((sum, item) => sum + (item.received_quantity || 0), 0) + 
                          receiptData.items.reduce((sum, item) => sum + item.received_quantity, 0);
    
    const newStatus = totalReceived >= totalOrdered ? 'fully_received' : 'partially_received';
    
    const updatedItems = receivingPO.items.map(poItem => {
      const receivedItem = receiptData.items.find(r => r.item_id === poItem.item_id);
      return {
        ...poItem,
        received_quantity: (poItem.received_quantity || 0) + (receivedItem?.received_quantity || 0)
      };
    });

    await base44.entities.PurchaseOrder.update(receivingPO.id, {
      status: newStatus,
      items: updatedItems
    });

    // Update supplier balance
    const suppliers = await base44.entities.Supplier.filter({ id: receivingPO.supplier_id });
    if (suppliers.length > 0) {
      await base44.entities.Supplier.update(receivingPO.supplier_id, {
        current_balance: (suppliers[0].current_balance || 0) + receiptData.total_amount
      });
    }

    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    setReceivingPO(null);
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Purchase Orders" 
          subtitle="Manage purchase orders and procurement"
          onAdd={() => { setEditingPO(null); setShowForm(true); }}
          addLabel="New PO"
        >
          <ColumnSelector
            columns={allColumns.filter(c => c.id !== 'actions')}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          <SyncDropdown
            onBulkUpload={() => setShowBulkUpload(true)}
            onBulkDelete={() => setShowBulkDelete(true)}
            onExportToExcel={() => {
              const headers = ['PO Number', 'PO Date', 'Supplier Code', 'Supplier Name', 'Delivery Date', 'Order Form No', 'Ship To', 'Shipping Address', 'Items Count', 'Subtotal', 'Tax', 'Shipping', 'Total Amount', 'Status', 'Notes'];
              const rows = filteredPOs.map(p => [
                p.po_number || '', p.po_date || '', p.supplier_code || '', p.supplier_name || '', 
                p.delivery_date || '', p.order_form_no || '', p.ship_to || '', p.shipping_address || '',
                p.items?.length || 0, p.subtotal || 0, p.tax_amount || 0, p.shipping_cost || 0, 
                p.total_amount || 0, p.status || 'draft', p.notes || ''
              ]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
          />
          {selectedRows.length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedRows.length})
            </Button>
          )}
        </PageHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-900">{pos.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredPOs.length}</span> Filtered</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">₹{totalValue.toFixed(2)}</span> Total Value</div>
              {selectedRows.length > 0 && (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <div><span className="font-semibold text-blue-600">{selectedRows.length}</span> Selected</div>
                </>
              )}
            </div>
          </div>

          <SearchFilter
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by PO number, supplier..."
            filters={[
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: 'Status',
                options: [
                  { value: 'draft', label: 'Draft' },
                  { value: 'pending_approval', label: 'Pending Approval' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'partially_received', label: 'Partially Received' },
                  { value: 'fully_received', label: 'Fully Received' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]
              }
            ]}
          />
        </div>

        {!isLoading && pos.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No purchase orders"
            description="Create your first purchase order to start procurement."
            actionLabel="Create PO"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns}
            visibleColumns={visibleColumns} 
            data={filteredPOs} 
            isLoading={isLoading}
            emptyMessage="No purchase orders match your search"
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <PurchaseOrderForm
          open={showForm}
          onOpenChange={setShowForm}
          po={editingPO}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <GoodsReceiptForm
          open={!!receivingPO}
          onOpenChange={() => setReceivingPO(null)}
          po={receivingPO}
          onSave={handleReceiveGoods}
          isLoading={false}
        />

        <ConfirmDialog
          open={!!deletePO}
          onOpenChange={() => setDeletePO(null)}
          title="Delete Purchase Order"
          description={`Are you sure you want to delete PO ${deletePO?.po_number}?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deletePO.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Purchase Orders"
          description={`Are you sure you want to delete ${selectedRows.length} selected purchase order(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        {/* View PO Dialog */}
        <Dialog open={!!viewPO} onOpenChange={() => setViewPO(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Purchase Order Details - {viewPO?.po_number}</DialogTitle>
            </DialogHeader>
            {viewPO && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Supplier</p>
                    <p className="font-medium">{viewPO.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">PO Date</p>
                    <p className="font-medium">{viewPO.po_date ? format(new Date(viewPO.po_date), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Delivery Date</p>
                    <p className="font-medium">{viewPO.delivery_date ? format(new Date(viewPO.delivery_date), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <StatusBadge status={viewPO.status} />
                  </div>
                </div>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Items</h4>
                  <div className="space-y-2">
                    {viewPO.items?.map((item, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 text-sm py-2 border-b last:border-0">
                        <span className="col-span-2">{item.item_name}</span>
                        <span className="text-right">{item.quantity} {item.unit}</span>
                        <span className="text-right">{viewPO.currency} {item.unit_price?.toFixed(2)}</span>
                        <span className="text-right font-medium">{viewPO.currency} {item.total?.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-5 gap-2 pt-2 font-semibold">
                      <span className="col-span-4 text-right">Total:</span>
                      <span className="text-right">{viewPO.currency} {viewPO.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {viewPO.notes && (
                  <div>
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="text-sm">{viewPO.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="PurchaseOrder"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                po_number: { type: "string" },
                po_date: { type: "string" },
                order_form_no: { type: "string" },
                supplier_id: { type: "string" },
                supplier_code: { type: "string" },
                supplier_name: { type: "string" },
                delivery_date: { type: "string" },
                ship_to: { type: "string" },
                shipping_address: { type: "string" },
                items: { type: "array" },
                total_amount: { type: "number" },
                status: { type: "string" }
              },
              required: ["po_date", "supplier_id"]
            }
          }}
          templateData={[
            'po_number,po_date,order_form_no,supplier_name,delivery_date,ship_to,shipping_address,total_amount,status',
            'Note: For complex PO uploads with line items, please use the individual PO form'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })}
        />

        <BulkDeleteDialog
          open={showBulkDelete}
          onOpenChange={setShowBulkDelete}
          entityName="PurchaseOrder"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })}
        />
      </div>
    </div>
  );
}