import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import PaymentForm from "@/components/payments/PaymentForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, DollarSign, Eye, Edit, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useEffect } from 'react';

const STORAGE_KEY = 'payments_visibleColumns';

export default function Payments() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date')
  });

  const { data: vendorBills = [] } = useQuery({
    queryKey: ['vendor-bills'],
    queryFn: () => base44.entities.VendorBill.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      await base44.entities.Payment.create(data);
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'Payment',
        entity_name: data.billNo,
        details: 'Created payment'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      await base44.entities.Payment.update(id, { ...data, updated_by: user.email });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'Payment',
        entity_id: id,
        entity_name: data.billNo,
        details: 'Updated payment'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowForm(false);
      setEditingPayment(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      const payment = payments.find(p => p.id === id);
      
      await base44.entities.Payment.update(id, {
        is_deleted: true,
        deleted_by: user.email,
        deleted_on: new Date().toISOString()
      });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'delete',
        entity_type: 'Payment',
        entity_id: id,
        entity_name: payment?.billNo,
        details: 'Deleted payment'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setDeletePayment(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      const user = await base44.auth.me();
      await Promise.all(rows.map(row => 
        base44.entities.Payment.update(row.id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredPayments = payments.filter(payment => {
    if (payment.is_deleted) return false;
    
    const matchesSearch = 
      payment.billNo?.toLowerCase().includes(search.toLowerCase()) ||
      payment.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      payment.utr?.toLowerCase().includes(search.toLowerCase()) ||
      payment.accountCode?.toLowerCase().includes(search.toLowerCase());
    const matchesSupplier = supplierFilter === 'all' || payment.supplier === supplierFilter;
    
    return matchesSearch && matchesSupplier;
  });

  const allColumns = [
    { id: 'billNo', header: "Bill No", accessor: "billNo", render: (row) => <span className="font-mono font-medium">{row.billNo}</span> },
    { id: 'paymentDate', header: "Date", accessor: "paymentDate" },
    { id: 'supplier', header: "Supplier", accessor: "supplier" },
    { id: 'paymentValue', header: "Amount", render: (row) => <span className="font-medium">{(row.paymentValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.paymentCurrency || 'USD' })}</span> },
    { id: 'tdsHoldValue', header: "TDS Hold", render: (row) => <span>{(row.tdsHoldValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.paymentCurrency || 'USD' })}</span> },
    { id: 'gstHoldValue', header: "GST Hold", render: (row) => <span>{(row.gstHoldValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.paymentCurrency || 'USD' })}</span> },
    { id: 'utr', header: "UTR", accessor: "utr" },
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
            <DropdownMenuItem onClick={() => { setViewingPayment(row); setShowForm(true); }}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingPayment(row); setViewingPayment(null); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeletePayment(row)} className="text-rose-600">
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
    if (!savedColumns.includes('actions')) savedColumns.push('actions');
    return savedColumns;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const totalValue = filteredPayments.reduce((sum, p) => {
    const value = p.paymentValue || 0;
    const inr = p.paymentCurrency === 'USD' ? value * 90 : value;
    return sum + inr;
  }, 0);

  const handleSave = (data) => {
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data });
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
          title="Payments" 
          subtitle="Manage vendor payments"
          onAdd={() => { setEditingPayment(null); setViewingPayment(null); setShowForm(true); }}
          addLabel="New Payment"
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
              const headers = ['billNo', 'paymentDate', 'supplier', 'paymentValue', 'tdsHoldValue', 'gstHoldValue', 'otherHoldValue', 'utr'];
              const rows = filteredPayments.map(p => [p.billNo, p.paymentDate, p.supplier, p.paymentValue, p.tdsHoldValue, p.gstHoldValue, p.otherHoldValue, p.utr]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div><span className="font-semibold text-slate-900">{payments.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredPayments.length}</span> Filtered</div>
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
            searchPlaceholder="Search by bill no, supplier, UTR..."
            filters={[
              {
                key: 'supplier',
                value: supplierFilter,
                onChange: setSupplierFilter,
                placeholder: 'Supplier',
                options: [...new Set(payments.map(p => p.supplier).filter(Boolean))].map(name => ({
                  value: name,
                  label: name
                }))
              }
            ]}
          />
        </div>

        {!isLoading && payments.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No payments yet"
            description="Create your first payment to get started."
            actionLabel="Create Payment"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns}
            visibleColumns={visibleColumns} 
            data={filteredPayments} 
            isLoading={isLoading}
            emptyMessage="No payments match your search"
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <PaymentForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setViewingPayment(null);
              setEditingPayment(null);
            }
          }}
          payment={viewingPayment || editingPayment}
          vendorBills={vendorBills}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          viewMode={!!viewingPayment}
        />

        <ConfirmDialog
          open={!!deletePayment}
          onOpenChange={() => setDeletePayment(null)}
          title="Delete Payment"
          description={`Are you sure you want to delete this payment?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deletePayment.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Payments"
          description={`Are you sure you want to delete ${selectedRows.length} selected payment(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="Payment"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                accountCode: { type: "string" },
                supplier: { type: "string" },
                billNo: { type: "string" },
                paymentDate: { type: "string" },
                paymentCurrency: { type: "string", enum: ["USD", "INR"] },
                paymentValue: { type: "number" },
                tdsHoldValue: { type: "number" },
                gstHoldValue: { type: "number" },
                otherHoldValue: { type: "number" },
                utr: { type: "string" }
              },
              required: ["supplier", "billNo", "paymentDate", "paymentValue"]
            }
          }}
          templateData={[
            'accountCode,supplier,billNo,paymentDate,paymentCurrency,paymentValue,tdsHoldValue,gstHoldValue,otherHoldValue,utr',
            '2000,Acme Corp,BILL-2024-001,2024-01-15,USD,10000,500,900,0,UTR123456'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}
        />
      </div>
    </div>
  );
}