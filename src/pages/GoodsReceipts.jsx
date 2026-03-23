import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import BulkDeleteDialog from "@/components/shared/BulkDeleteDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const STORAGE_KEY = 'goodsReceipts_visibleColumns';

export default function GoodsReceipts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewReceipt, setViewReceipt] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['goods-receipts'],
    queryFn: () => base44.entities.GoodsReceipt.list('-created_date')
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      await Promise.all(rows.map(row => base44.entities.GoodsReceipt.delete(row.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allColumns = [
    { 
      id: "receipt_number",
      header: "Receipt #", 
      render: (row) => <span className="font-mono font-medium text-slate-900">{row.receipt_number || '-'}</span>
    },
    { 
      id: "receipt_date",
      header: "Date", 
      render: (row) => row.receipt_date ? format(new Date(row.receipt_date), 'MMM d, yyyy') : '-'
    },
    { 
      id: "po_number",
      header: "PO Number", 
      render: (row) => <span className="font-medium text-slate-700">{row.po_number}</span>
    },
    { 
      id: "supplier_name",
      header: "Supplier", 
      render: (row) => <span className="text-slate-900">{row.supplier_name}</span>
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
      header: "Total Received", 
      render: (row) => (
        <span className="font-medium">
          {row.currency} {(row.total_amount || 0).toFixed(2)}
        </span>
      )
    },
    { 
      id: "invoice_number",
      header: "Invoice #", 
      render: (row) => <span className="text-slate-500">{row.invoice_number || '-'}</span>
    },
    { 
      id: "quality_check",
      header: "Quality Check", 
      render: (row) => {
        const colors = {
          pending: "bg-amber-50 text-amber-700 border-amber-200",
          passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
          failed: "bg-rose-50 text-rose-700 border-rose-200",
          partial: "bg-blue-50 text-blue-700 border-blue-200"
        };
        return (
          <Badge variant="outline" className={colors[row.quality_check_status] || colors.pending}>
            {row.quality_check_status || 'pending'}
          </Badge>
        );
      }
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewReceipt(row)}>
          <Eye className="w-4 h-4" />
        </Button>
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

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Goods Receipts" 
          subtitle="Track all received goods and inventory updates"
        >
          <ColumnSelector
            columns={allColumns.filter(c => c.id !== 'actions')}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          <SyncDropdown
            onBulkDelete={() => setShowBulkDelete(true)}
            onExportToExcel={() => {
              const headers = ['Receipt Number', 'Receipt Date', 'PO Number', 'Supplier Name', 'Items Count', 'Total Amount', 'Currency', 'Invoice Number', 'Quality Check Status', 'Received By', 'Status'];
              const rows = filteredReceipts.map(r => [
                r.receipt_number || '', r.receipt_date || '', r.po_number || '', r.supplier_name || '', 
                r.items?.length || 0, r.total_amount || 0, r.currency || 'USD', r.invoice_number || '', 
                r.quality_check_status || 'pending', r.received_by || '', r.status || 'draft'
              ]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `goods_receipts_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div><span className="font-semibold text-slate-900">{receipts.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredReceipts.length}</span> Filtered</div>
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
            searchPlaceholder="Search by receipt #, PO #, supplier..."
            filters={[
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: 'Status',
                options: [
                  { value: 'draft', label: 'Draft' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]
              }
            ]}
          />
        </div>

        {!isLoading && receipts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No goods receipts"
            description="Goods receipts will appear here when you receive items against purchase orders."
          />
        ) : (
          <DataTable 
            columns={allColumns}
            visibleColumns={visibleColumns} 
            data={filteredReceipts} 
            isLoading={isLoading}
            emptyMessage="No receipts match your search"
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Goods Receipts"
          description={`Are you sure you want to delete ${selectedRows.length} selected goods receipt(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkDeleteDialog
          open={showBulkDelete}
          onOpenChange={setShowBulkDelete}
          entityName="GoodsReceipt"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['goods-receipts'] })}
        />

        {/* View Receipt Dialog */}
        <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Goods Receipt - {viewReceipt?.receipt_number}
              </DialogTitle>
            </DialogHeader>
            {viewReceipt && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Receipt Date</p>
                    <p className="font-medium">{viewReceipt.receipt_date ? format(new Date(viewReceipt.receipt_date), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">PO Number</p>
                    <p className="font-medium">{viewReceipt.po_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Supplier</p>
                    <p className="font-medium">{viewReceipt.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Invoice Number</p>
                    <p className="font-medium">{viewReceipt.invoice_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Quality Check</p>
                    <Badge variant="outline" className="capitalize">
                      {viewReceipt.quality_check_status || 'pending'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Received By</p>
                    <p className="font-medium">{viewReceipt.received_by || viewReceipt.created_by}</p>
                  </div>
                </div>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Received Items</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-slate-500 pb-2 border-b">
                      <span className="col-span-2">Item</span>
                      <span className="text-right">Ordered</span>
                      <span className="text-right">Received</span>
                      <span>Location</span>
                      <span className="text-right">Total</span>
                    </div>
                    {viewReceipt.items?.map((item, i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 text-sm py-2 border-b last:border-0">
                        <div className="col-span-2">
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-xs text-slate-500">{item.item_sku}</p>
                        </div>
                        <span className="text-right text-slate-600">{item.ordered_quantity} {item.unit}</span>
                        <span className="text-right font-medium">{item.received_quantity} {item.unit}</span>
                        <span className="text-slate-600">{item.warehouse_location || '-'}</span>
                        <span className="text-right font-medium">{viewReceipt.currency} {item.total?.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-6 gap-2 pt-2 font-semibold">
                      <span className="col-span-5 text-right">Total Received:</span>
                      <span className="text-right">{viewReceipt.currency} {viewReceipt.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {viewReceipt.notes && (
                  <div>
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="text-sm">{viewReceipt.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}