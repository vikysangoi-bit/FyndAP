import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import ResizableTable from "@/components/shared/ResizableTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import BulkDeleteDialog from "@/components/shared/BulkDeleteDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import ColumnSelector from "@/components/shared/ColumnSelector";
import TransactionForm from "@/components/inventory/TransactionForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ArrowRightLeft, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { format } from "date-fns";

const typeConfig = {
  receipt: { label: "Receipt", color: "bg-emerald-100 text-emerald-700", icon: ArrowDownLeft },
  issue: { label: "Issue", color: "bg-rose-100 text-rose-700", icon: ArrowUpRight },
  adjustment: { label: "Adjustment", color: "bg-amber-100 text-amber-700", icon: RefreshCw },
  transfer: { label: "Transfer", color: "bg-blue-100 text-blue-700", icon: ArrowRightLeft },
  return: { label: "Return", color: "bg-purple-100 text-purple-700", icon: ArrowDownLeft },
};

const STORAGE_KEY = 'inventoryTransactions_visibleColumns';

export default function InventoryTransactions() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteTransaction, setDeleteTransaction] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: () => base44.entities.InventoryTransaction.list('-created_date')
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryTransaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryTransaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryTransaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setDeleteTransaction(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      await Promise.all(rows.map(row => base44.entities.InventoryTransaction.delete(row.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });



  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.transaction_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.po_number?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const generateTxNumber = () => {
    const count = transactions.length + 1;
    return `TXN-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
  };

  const allColumns = [
    { 
      id: "transaction_number",
      header: "Transaction #", 
      render: (row) => <span className="font-mono font-medium text-slate-900">{row.transaction_number || '-'}</span>
    },
    { 
      id: "transaction_date",
      header: "Date", 
      render: (row) => row.transaction_date ? format(new Date(row.transaction_date), 'MMM d, yyyy') : '-'
    },
    { 
      id: "type",
      header: "Type", 
      render: (row) => {
        const config = typeConfig[row.type] || { label: row.type, color: "bg-slate-100 text-slate-700" };
        return (
          <Badge className={`${config.color} border-0`}>
            {config.label}
          </Badge>
        );
      }
    },
    { 
      id: "po_number",
      header: "PO Number", 
      render: (row) => <span className="font-mono text-slate-900">{row.po_number || '-'}</span>
    },
    { 
      id: "items_count",
      header: "Items", 
      render: (row) => <span className="font-medium">{row.items?.length || 0} items</span>
    },
    {
      id: "application_status",
      header: "Status",
      render: (row) => {
        const statusColors = {
          'Unapplied': 'bg-slate-100 text-slate-700',
          'Partial Applied': 'bg-amber-100 text-amber-700',
          'Applied': 'bg-emerald-100 text-emerald-700'
        };
        const status = row.application_status || 'Unapplied';
        return (
          <Badge className={`${statusColors[status]} border-0`}>
            {status}
          </Badge>
        );
      }
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
            <DropdownMenuItem onClick={() => { setEditingTransaction(row); setShowForm(true); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteTransaction(row)} className="text-rose-600">
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
    return saved ? JSON.parse(saved) : allColumns.map(c => c.id).filter(id => id);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const handleSave = (data) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate({ ...data, transaction_number: generateTxNumber() });
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Inventory Transactions" 
          subtitle="Track stock movements and adjustments"
          onAdd={() => { setEditingTransaction(null); setShowForm(true); }}
          addLabel="New Transaction"
        >
          <ColumnSelector
            columns={allColumns.filter(c => c.id !== 'actions')}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          <SyncDropdown
            onBulkDelete={() => setShowBulkDelete(true)}
            onExportToExcel={() => {
              const headers = ['Transaction Number', 'Transaction Date', 'Type', 'PO Number', 'Style ID', 'Name', 'Color', 'Size', 'Quantity', 'From Location', 'To Location', 'Status'];
              const rows = filteredTransactions.flatMap(t => 
                (t.items || []).map(item => [
                  t.transaction_number || '', t.transaction_date || '', t.type || '', t.po_number || '',
                  item.styleID || '', item.name || '', item.color || '', item.size || '', item.quantity || 0,
                  t.from_location || '', t.to_location || '', t.status || 'draft'
                ])
              );
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inventory_transactions_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div><span className="font-semibold text-slate-900">{transactions.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredTransactions.length}</span> Filtered</div>
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
            searchPlaceholder="Search by transaction #, PO number..."
            filters={[
              {
                key: 'type',
                value: typeFilter,
                onChange: setTypeFilter,
                placeholder: 'Type',
                options: Object.entries(typeConfig).map(([value, { label }]) => ({ value, label }))
              }
            ]}
          />
        </div>

        {!isLoading && transactions.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="No transactions"
            description="Record your first inventory transaction."
            actionLabel="New Transaction"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <ResizableTable 
            columns={allColumns}
            visibleColumns={visibleColumns} 
            data={filteredTransactions} 
            isLoading={isLoading}
            emptyMessage="No transactions match your search"
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            storageKey={STORAGE_KEY}
          />
        )}

        <TransactionForm
          open={showForm}
          onOpenChange={setShowForm}
          transaction={editingTransaction}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <ConfirmDialog
          open={!!deleteTransaction}
          onOpenChange={() => setDeleteTransaction(null)}
          title="Delete Transaction"
          description={`Are you sure you want to delete this transaction? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteTransaction.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Transactions"
          description={`Are you sure you want to delete ${selectedRows.length} selected transaction(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkDeleteDialog
          open={showBulkDelete}
          onOpenChange={setShowBulkDelete}
          entityName="InventoryTransaction"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })}
        />
      </div>
    </div>
  );
}