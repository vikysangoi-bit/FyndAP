import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import VendorBillForm from "@/components/vendorbills/VendorBillForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import StatusBadge from "@/components/shared/StatusBadge";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Eye, Edit, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const STORAGE_KEY = 'vendorBills_visibleColumns';

export default function VendorBills() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [viewingBill, setViewingBill] = useState(null);
  const [deleteBill, setDeleteBill] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: vendorBills = [], isLoading } = useQuery({
    queryKey: ['vendor-bills'],
    queryFn: () => base44.entities.VendorBill.list('-created_date')
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.list()
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const bill = await base44.entities.VendorBill.create(data);
      
      // Update inventory quantities if line items exist
      if (data.lineItems && data.lineItems.length > 0) {
        for (const item of data.lineItems) {
          if (item.itemCode) {
            const invItems = await base44.entities.InventoryItem.filter({ itemCode: item.itemCode });
            if (invItems.length > 0) {
              const invItem = invItems[0];
              await base44.entities.InventoryItem.update(invItem.id, {
                quantity_on_hand: (invItem.quantity_on_hand || 0) + (item.quantity || 0)
              });
            }
          }
        }
      }

      // Update GRN application status if grn_number exists
      if (data.grn_number) {
        const txns = await base44.entities.InventoryTransaction.filter({ transaction_number: data.grn_number });
        if (txns.length > 0) {
          const txn = txns[0];
          
          // Get all vendor bills using this GRN
          const allBills = await base44.entities.VendorBill.filter({ grn_number: data.grn_number });
          
          // Calculate total quantities used across all bills
          const usedQuantities = {};
          allBills.forEach(bill => {
            if (bill.lineItems) {
              bill.lineItems.forEach(item => {
                const key = item.item_sku || item.itemCode;
                if (key) {
                  usedQuantities[key] = (usedQuantities[key] || 0) + (item.quantity || 0);
                }
              });
            }
          });
          
          // Compare with GRN quantities
          let allUsed = true;
          let someUsed = false;
          if (txn.items) {
            txn.items.forEach(item => {
              const key = item.item_sku || item.itemCode;
              const used = usedQuantities[key] || 0;
              const total = item.quantity || 0;
              
              if (used < total) allUsed = false;
              if (used > 0) someUsed = true;
            });
          }
          
          const applicationStatus = allUsed ? 'Applied' : (someUsed ? 'Partial Applied' : 'Unapplied');
          await base44.entities.InventoryTransaction.update(txn.id, { application_status: applicationStatus });
        }
      }
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'VendorBill',
        entity_name: data.billNo,
        details: 'Created vendor bill'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      await base44.entities.VendorBill.update(id, { ...data, updated_by: user.email });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'VendorBill',
        entity_id: id,
        entity_name: data.billNo,
        details: 'Updated vendor bill'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      setShowForm(false);
      setEditingBill(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      const bill = vendorBills.find(b => b.id === id);
      
      await base44.entities.VendorBill.update(id, {
        is_deleted: true,
        deleted_by: user.email,
        deleted_on: new Date().toISOString()
      });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'delete',
        entity_type: 'VendorBill',
        entity_id: id,
        entity_name: bill?.billNo,
        details: 'Deleted vendor bill'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      setDeleteBill(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      const user = await base44.auth.me();
      await Promise.all(rows.map(row => 
        base44.entities.VendorBill.update(row.id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredBills = vendorBills.filter(bill => {
    if (bill.is_deleted) return false;
    
    const matchesSearch = 
      bill.billNo?.toLowerCase().includes(search.toLowerCase()) ||
      bill.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      bill.poNo?.toLowerCase().includes(search.toLowerCase()) ||
      bill.accountCode?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.currentStatus === statusFilter;
    const matchesService = serviceFilter === 'all' || bill.serviceName === serviceFilter;
    const matchesSupplier = supplierFilter === 'all' || bill.supplier === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesService && matchesSupplier;
  });

  const allColumns = [
    { id: 'billNo', header: "Bill No", accessor: "billNo", render: (row) => <span className="font-mono font-medium">{row.billNo}</span> },
    { id: 'billDate', header: "Date", accessor: "billDate" },
    { id: 'accountCode', header: "Account Code", accessor: "accountCode" },
    { id: 'supplier', header: "Supplier", accessor: "supplier" },
    { id: 'poNo', header: "PO No", accessor: "poNo" },
    { id: 'serviceName', header: "Service", accessor: "serviceName" },
    { id: 'billValue', header: "Value", render: (row) => <span className="font-medium">{(row.billValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.billingCurrency || 'USD' })}</span> },
    { id: 'paymentDueDate', header: "Due Date", accessor: "paymentDueDate" },
    { id: 'status', header: "Status", render: (row) => <StatusBadge status={row.currentStatus?.toLowerCase().replace(/ /g, '_')} /> },
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
            <DropdownMenuItem onClick={() => { setViewingBill(row); setShowForm(true); }}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingBill(row); setViewingBill(null); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteBill(row)} className="text-rose-600">
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

  const totalValue = filteredBills.reduce((sum, bill) => {
    const value = bill.billValue || 0;
    const rate = currencies.find(c => c.code === (bill.billingCurrency || 'INR'))?.exchange_rate || 1;
    return sum + (value * rate);
  }, 0);

  const handleSave = (data) => {
    if (editingBill) {
      updateMutation.mutate({ id: editingBill.id, data });
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
          title="Vendor Bills" 
          subtitle="Manage vendor bills and payments"
          onAdd={() => { setEditingBill(null); setViewingBill(null); setShowForm(true); }}
          addLabel="New Vendor Bill"
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
              const headers = ['billNo', 'billDate', 'accountCode', 'supplier', 'poNo', 'serviceName', 'billValue', 'currentStatus'];
              const rows = filteredBills.map(b => [b.billNo, b.billDate, b.accountCode, b.supplier, b.poNo, b.serviceName, b.billValue, b.currentStatus]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vendor_bills_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div><span className="font-semibold text-slate-900">{vendorBills.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredBills.length}</span> Filtered</div>
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

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by bill no, supplier, PO no..."
            filters={[
              {
                key: 'service',
                value: serviceFilter,
                onChange: setServiceFilter,
                placeholder: 'Service',
                options: [
                  { value: 'DaaS', label: 'DaaS' },
                  { value: 'GaaS', label: 'GaaS' },
                  { value: 'AI Photoshoot', label: 'AI Photoshoot' }
                ]
              },
              {
                key: 'supplier',
                value: supplierFilter,
                onChange: setSupplierFilter,
                placeholder: 'Supplier',
                options: [...new Set(vendorBills.map(b => b.supplier).filter(Boolean))].map(name => ({
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
                  { value: 'Open', label: 'Open' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Partially paid', label: 'Partially Paid' }
                ]
              }
            ]}
          />
        </div>

        {!isLoading && vendorBills.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No vendor bills yet"
            description="Create your first vendor bill to get started."
            actionLabel="Create Vendor Bill"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns}
            visibleColumns={visibleColumns} 
            data={filteredBills} 
            isLoading={isLoading}
            emptyMessage="No vendor bills match your search"
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <VendorBillForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setViewingBill(null);
              setEditingBill(null);
            }
          }}
          vendorBill={viewingBill || editingBill}
          accounts={accounts}
          purchaseOrders={purchaseOrders}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          viewMode={!!viewingBill}
        />

        <ConfirmDialog
          open={!!deleteBill}
          onOpenChange={() => setDeleteBill(null)}
          title="Delete Vendor Bill"
          description={`Are you sure you want to delete vendor bill "${deleteBill?.billNo}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteBill.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Vendor Bills"
          description={`Are you sure you want to delete ${selectedRows.length} selected vendor bill(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="VendorBill"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                accountCode: { type: "string" },
                supplier: { type: "string" },
                serviceName: { type: "string", enum: ["DaaS", "GaaS", "AI Photoshoot"] },
                poNo: { type: "string" },
                billNo: { type: "string" },
                billDate: { type: "string" },
                billingCurrency: { type: "string", enum: ["USD", "INR"] },
                billNetValue: { type: "number" },
                billTaxValue: { type: "number" },
                billValue: { type: "number" },
                billSharedOn: { type: "string" },
                paymentTerms: { type: "string", enum: ["net_30", "net_45", "net_60", "net_90"] },
                paymentDueDate: { type: "string" },
                currentStatus: { type: "string", enum: ["Open", "Paid", "Partially paid"] }
              },
              required: ["billNo", "billDate", "supplier"]
            }
          }}
          templateData={[
            'accountCode,supplier,serviceName,poNo,billNo,billDate,billingCurrency,billNetValue,billTaxValue,billValue,billSharedOn,paymentTerms,paymentDueDate,currentStatus',
            '2000,Acme Corp,DaaS,PO-2024-001,BILL-2024-001,2024-01-15,USD,10000,1800,11800,2024-01-15,net_30,2024-02-14,Open'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['vendor-bills'] })}
        />
      </div>
    </div>
  );
}