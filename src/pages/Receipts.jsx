import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import ReceiptForm from "@/components/receipts/ReceiptForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Receipt, Eye, Edit, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useEffect } from 'react';

const STORAGE_KEY = 'receipts_visibleColumns';

export default function Receipts() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [deleteReceipt, setDeleteReceipt] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [receiptMonthFilter, setReceiptMonthFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => base44.entities.Receipt.list('-created_date')
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list()
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      await base44.entities.Receipt.create(data);
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'Receipt',
        entity_name: data.utr || data.invoiceNo,
        details: 'Created receipt'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      await base44.entities.Receipt.update(id, { ...data, updated_by: user.email });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'Receipt',
        entity_id: id,
        entity_name: data.utr || data.invoiceNo,
        details: 'Updated receipt'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setShowForm(false);
      setEditingReceipt(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      const receipt = receipts.find(r => r.id === id);
      
      await base44.entities.Receipt.update(id, {
        is_deleted: true,
        deleted_by: user.email,
        deleted_on: new Date().toISOString()
      });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'delete',
        entity_type: 'Receipt',
        entity_id: id,
        entity_name: receipt?.utr || receipt?.invoiceNo,
        details: 'Deleted receipt'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setDeleteReceipt(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      const user = await base44.auth.me();
      await Promise.all(rows.map(row => 
        base44.entities.Receipt.update(row.id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredReceipts = receipts.filter(receipt => {
    if (receipt.is_deleted) return false;
    
    const matchesSearch = 
      receipt.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.utr?.toLowerCase().includes(search.toLowerCase());
    const matchesClient = clientFilter === 'all' || receipt.customerName === clientFilter;
    
    const matchesReceiptMonth = receiptMonthFilter === 'all' || (() => {
      if (!receipt.receiptDate) return false;
      const receiptDate = new Date(receipt.receiptDate);
      return `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, '0')}` === receiptMonthFilter;
    })();
    
    return matchesSearch && matchesClient && matchesReceiptMonth;
  });

  const allColumns = [
    { id: 'receiptDate', header: "Date", accessor: "receiptDate" },
    { id: 'customerCode', header: "Customer Code", accessor: "customerCode" },
    { id: 'customerName', header: "Customer Name", accessor: "customerName" },
    { id: 'invoiceNo', header: "Invoice No", accessor: "invoiceNo", render: (row) => <span className="font-mono font-medium">{row.invoiceNo}</span> },
    { id: 'utr', header: "UTR", accessor: "utr" },
    { id: 'receiptValue', header: "Receipt Value", render: (row) => <span className="font-medium">{(row.receiptValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.receiptCurrency || 'USD' })}</span> },
    { id: 'tdsHoldValue', header: "TDS Hold", render: (row) => <span>{(row.tdsHoldValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.receiptCurrency || 'USD' })}</span> },
    { id: 'gstHoldValue', header: "GST Hold", render: (row) => <span>{(row.gstHoldValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.receiptCurrency || 'USD' })}</span> },
    { id: 'otherHoldValue', header: "Other Hold", render: (row) => <span>{(row.otherHoldValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.receiptCurrency || 'USD' })}</span> },
    { id: 'receiverBank', header: "Bank", accessor: "receiverBank" },
    {
      id: 'actions',
      header: "",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setViewingReceipt(row); setShowForm(true); }}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingReceipt(row); setViewingReceipt(null); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteReceipt(row)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedColumns = saved ? JSON.parse(saved) : allColumns.map(c => c.id);
    if (!savedColumns.includes('actions')) {
      savedColumns.push('actions');
    }
    return savedColumns;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const totalValue = filteredReceipts.reduce((sum, r) => {
    const value = r.receiptValue || 0;
    const inr = r.receiptCurrency === 'USD' ? value * 90 : value;
    return sum + inr;
  }, 0);

  const handleSave = (data) => {
    if (editingReceipt) {
      updateMutation.mutate({ id: editingReceipt.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Receipts" 
          subtitle="Manage customer receipts and payments"
          onAdd={() => { setEditingReceipt(null); setViewingReceipt(null); setShowForm(true); }}
          addLabel="New Receipt"
        >
          <ColumnSelector
            columns={allColumns.filter(c => c.id !== 'actions')}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          <SyncDropdown
            onBulkUpload={() => setShowBulkUpload(true)}
            onBulkDelete={() => {}}
            onGoogleSheetsImport={() => {}}
            onGoogleSheetsExport={() => {}}
            onExportToExcel={() => {
              const headers = ['receiptDate', 'customerCode', 'customerName', 'invoiceNo', 'utr', 'receiptValue', 'tdsHoldValue', 'gstHoldValue', 'receiverBank'];
              const rows = filteredReceipts.map(r => [r.receiptDate, r.customerCode, r.customerName, r.invoiceNo, r.utr, r.receiptValue, r.tdsHoldValue, r.gstHoldValue, r.receiverBank]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `receipts_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">₹{totalValue.toFixed(2)}</span> Total Value</div>
            </div>
          </div>

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by invoice no, customer, UTR..."
            filters={[
              {
                key: 'client',
                value: clientFilter,
                onChange: setClientFilter,
                placeholder: 'Client Name',
                options: [...new Set(receipts.map(r => r.customerName).filter(Boolean))].map(name => ({
                  value: name,
                  label: name
                }))
              },
              {
                key: 'receiptMonth',
                value: receiptMonthFilter,
                onChange: setReceiptMonthFilter,
                placeholder: 'Receipt Month',
                options: [...new Set(receipts.map(r => {
                  if (!r.receiptDate) return null;
                  const date = new Date(r.receiptDate);
                  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }).filter(Boolean))].sort().reverse().map(month => {
                  const [year, m] = month.split('-');
                  const monthName = new Date(year, parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return { value: month, label: monthName };
                })
              }
            ]}
          />
        </div>

        {!isLoading && receipts.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No receipts yet"
            description="Create your first receipt to get started."
            actionLabel="Create Receipt"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns} 
            data={filteredReceipts} 
            isLoading={isLoading}
            emptyMessage="No receipts match your search"
            visibleColumns={visibleColumns}
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <ReceiptForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setViewingReceipt(null);
              setEditingReceipt(null);
            }
          }}
          receipt={viewingReceipt || editingReceipt}
          invoices={invoices}
          accounts={accounts}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          viewMode={!!viewingReceipt}
        />

        <ConfirmDialog
          open={!!deleteReceipt}
          onOpenChange={() => setDeleteReceipt(null)}
          title="Delete Receipt"
          description={`Are you sure you want to delete receipt for invoice "${deleteReceipt?.invoiceNo}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteReceipt.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Receipts"
          description={`Are you sure you want to delete ${selectedRows.length} selected receipt(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="Receipt"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                customerCode: { type: "string" },
                customerName: { type: "string" },
                invoiceNo: { type: "string" },
                receiptDate: { type: "string" },
                receiptCurrency: { type: "string", enum: ["USD", "INR"] },
                receiptValue: { type: "number" },
                tdsHoldValue: { type: "number" },
                gstHoldValue: { type: "number" },
                otherHoldValue: { type: "number" },
                utr: { type: "string" },
                receiverBank: { type: "string" }
              },
              required: ["customerCode", "invoiceNo", "receiptDate", "receiptValue"]
            }
          }}
          templateData={[
            'customerCode,customerName,invoiceNo,receiptDate,receiptCurrency,receiptValue,tdsHoldValue,gstHoldValue,otherHoldValue,utr,receiverBank',
            '1000,ABC Corp,INV-2024-001,2024-01-20,USD,11800,0,0,0,UTR123456789,HDFC Bank'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['receipts'] })}
        />
      </div>
    </div>
  );
}