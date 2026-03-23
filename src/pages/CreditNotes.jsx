import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import CreditNoteForm from "@/components/creditnotes/CreditNoteForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import StatusBadge from "@/components/shared/StatusBadge";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Eye, Edit, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useEffect } from 'react';

const STORAGE_KEY = 'creditNotes_visibleColumns';

export default function CreditNotes() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingCreditNote, setEditingCreditNote] = useState(null);
  const [viewingCreditNote, setViewingCreditNote] = useState(null);
  const [deleteCreditNote, setDeleteCreditNote] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: creditNotes = [], isLoading } = useQuery({
    queryKey: ['credit-notes'],
    queryFn: () => base44.entities.CreditNote.list('-created_date')
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
      
      // Auto-set status based on invoice presence
      if (!data.cnStatus) {
        data.cnStatus = data.invoiceNo ? 'Applied' : 'Adjustment';
      }
      
      await base44.entities.CreditNote.create(data);
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'CreditNote',
        entity_name: data.creditNoteNo,
        details: 'Created credit note'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      await base44.entities.CreditNote.update(id, { ...data, updated_by: user.email });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'CreditNote',
        entity_id: id,
        entity_name: data.creditNoteNo,
        details: 'Updated credit note'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      setShowForm(false);
      setEditingCreditNote(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      const creditNote = creditNotes.find(cn => cn.id === id);
      
      await base44.entities.CreditNote.update(id, {
        is_deleted: true,
        deleted_by: user.email,
        deleted_on: new Date().toISOString()
      });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'delete',
        entity_type: 'CreditNote',
        entity_id: id,
        entity_name: creditNote?.creditNoteNo,
        details: 'Deleted credit note'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      setDeleteCreditNote(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      const user = await base44.auth.me();
      await Promise.all(rows.map(row => 
        base44.entities.CreditNote.update(row.id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredCreditNotes = creditNotes.filter(cn => {
    if (cn.is_deleted) return false;
    
    const matchesSearch = 
      cn.creditNoteNo?.toLowerCase().includes(search.toLowerCase()) ||
      cn.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
      cn.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      cn.invoiceNo?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cn.cnStatus === statusFilter;
    const matchesClient = clientFilter === 'all' || cn.customerName === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const allColumns = [
    { id: 'creditNoteNo', header: "CN No", accessor: "creditNoteNo", render: (row) => <span className="font-mono font-medium">{row.creditNoteNo}</span> },
    { id: 'cnDate', header: "Date", accessor: "cnDate" },
    { id: 'customerCode', header: "Customer Code", accessor: "customerCode" },
    { id: 'customerName', header: "Customer Name", accessor: "customerName" },
    { id: 'invoiceNo', header: "Invoice No", accessor: "invoiceNo", render: (row) => row.invoiceNo || <span className="text-slate-400">-</span> },
    { id: 'cnNetValue', header: "Net Value", render: (row) => <span>{(row.cnNetValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.cnCurrency || 'USD' })}</span> },
    { id: 'cnTaxValue', header: "Tax Value", render: (row) => <span>{(row.cnTaxValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.cnCurrency || 'USD' })}</span> },
    { id: 'cnValue', header: "Total Value", render: (row) => <span className="font-medium">{(row.cnValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.cnCurrency || 'USD' })}</span> },
    { id: 'status', header: "Status", render: (row) => <StatusBadge status={row.cnStatus?.toLowerCase()} /> },
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
            <DropdownMenuItem onClick={() => { setViewingCreditNote(row); setShowForm(true); }}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingCreditNote(row); setViewingCreditNote(null); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteCreditNote(row)} className="text-rose-600">
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

  const totalValue = filteredCreditNotes.reduce((sum, cn) => {
    const value = cn.cnValue || 0;
    const inr = cn.cnCurrency === 'USD' ? value * 90 : value;
    return sum + inr;
  }, 0);

  const handleSave = (data) => {
    if (editingCreditNote) {
      updateMutation.mutate({ id: editingCreditNote.id, data });
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
          title="Credit Notes" 
          subtitle="Manage customer credit notes"
          onAdd={() => { setEditingCreditNote(null); setViewingCreditNote(null); setShowForm(true); }}
          addLabel="New Credit Note"
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
              const headers = ['creditNoteNo', 'cnDate', 'customerCode', 'customerName', 'invoiceNo', 'cnValue', 'cnStatus'];
              const rows = filteredCreditNotes.map(cn => [cn.creditNoteNo, cn.cnDate, cn.customerCode, cn.customerName, cn.invoiceNo, cn.cnValue, cn.cnStatus]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `credit_notes_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div><span className="font-semibold text-slate-900">{creditNotes.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredCreditNotes.length}</span> Filtered</div>
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
            searchPlaceholder="Search by CN no, customer, invoice no..."
            filters={[
              {
                key: 'client',
                value: clientFilter,
                onChange: setClientFilter,
                placeholder: 'Client',
                options: [...new Set(creditNotes.map(cn => cn.customerName).filter(Boolean))].map(name => ({
                  value: name,
                  label: name
                }))
              },
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: 'Status',
                options: [
                  { value: 'Applied', label: 'Applied' },
                  { value: 'Adjustment', label: 'Adjustment' }
                ]
              }
            ]}
          />
        </div>

        {!isLoading && creditNotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No credit notes yet"
            description="Create your first credit note to get started."
            actionLabel="Create Credit Note"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns} 
            data={filteredCreditNotes} 
            isLoading={isLoading}
            emptyMessage="No credit notes match your search"
            visibleColumns={visibleColumns}
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <CreditNoteForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setViewingCreditNote(null);
              setEditingCreditNote(null);
            }
          }}
          creditNote={viewingCreditNote || editingCreditNote}
          invoices={invoices}
          accounts={accounts}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          viewMode={!!viewingCreditNote}
        />

        <ConfirmDialog
          open={!!deleteCreditNote}
          onOpenChange={() => setDeleteCreditNote(null)}
          title="Delete Credit Note"
          description={`Are you sure you want to delete credit note "${deleteCreditNote?.creditNoteNo}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteCreditNote.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Credit Notes"
          description={`Are you sure you want to delete ${selectedRows.length} selected credit note(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="CreditNote"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                customerCode: { type: "string" },
                customerName: { type: "string" },
                invoiceNo: { type: "string" },
                creditNoteNo: { type: "string" },
                cnDate: { type: "string" },
                cnCurrency: { type: "string", enum: ["USD", "INR"] },
                cnNetValue: { type: "number" },
                cnTaxValue: { type: "number" },
                cnValue: { type: "number" },
                cnStatus: { type: "string", enum: ["Applied", "Adjustment"] }
              },
              required: ["creditNoteNo", "customerCode", "cnDate"]
            }
          }}
          templateData={[
            'customerCode,customerName,invoiceNo,creditNoteNo,cnDate,cnCurrency,cnNetValue,cnTaxValue,cnValue,cnStatus',
            '1000,ABC Corp,INV-2024-001,CN-2024-001,2024-01-20,USD,1000,180,1180,Applied',
            '1001,XYZ Ltd,,CN-2024-002,2024-01-21,USD,500,90,590,Adjustment'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['credit-notes'] })}
        />
      </div>
    </div>
  );
}