import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import StatusBadge from "@/components/shared/StatusBadge";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Eye, Edit, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useEffect } from 'react';

const STORAGE_KEY = 'invoices_visibleColumns';

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState('all');
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date')
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => base44.entities.SalesOrder.list()
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const invoice = await base44.entities.Invoice.create(data);
      
      // Reduce inventory quantities if line items exist
      if (data.lineItems && data.lineItems.length > 0) {
        for (const item of data.lineItems) {
          if (item.itemCode) {
            const invItems = await base44.entities.InventoryItem.filter({ itemCode: item.itemCode });
            if (invItems.length > 0) {
              const invItem = invItems[0];
              await base44.entities.InventoryItem.update(invItem.id, {
                quantity_on_hand: (invItem.quantity_on_hand || 0) - (item.quantity || 0)
              });
            }
          }
        }
      }

      // Update GON application status if gon_number exists
      if (data.gon_number) {
        const txns = await base44.entities.InventoryTransaction.filter({ transaction_number: data.gon_number });
        if (txns.length > 0) {
          const txn = txns[0];
          
          // Get all invoices using this GON
          const allInvoices = await base44.entities.Invoice.filter({ gon_number: data.gon_number });
          
          // Calculate total quantities used across all invoices
          const usedQuantities = {};
          allInvoices.forEach(inv => {
            if (inv.lineItems) {
              inv.lineItems.forEach(item => {
                const key = item.itemCode;
                if (key) {
                  usedQuantities[key] = (usedQuantities[key] || 0) + (item.quantity || 0);
                }
              });
            }
          });
          
          // Compare with GON quantities
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
        entity_type: 'Invoice',
        entity_name: data.invoiceNo,
        details: 'Created invoice'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      await base44.entities.Invoice.update(id, { ...data, updated_by: user.email });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'Invoice',
        entity_id: id,
        entity_name: data.invoiceNo,
        details: 'Updated invoice'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowForm(false);
      setEditingInvoice(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      const invoice = invoices.find(i => i.id === id);
      
      await base44.entities.Invoice.update(id, {
        is_deleted: true,
        deleted_by: user.email,
        deleted_on: new Date().toISOString()
      });
      
      await base44.functions.invoke('logAuditEntry', {
        action: 'delete',
        entity_type: 'Invoice',
        entity_id: id,
        entity_name: invoice?.invoiceNo,
        details: 'Deleted invoice'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteInvoice(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      const user = await base44.auth.me();
      await Promise.all(rows.map(row => 
        base44.entities.Invoice.update(row.id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredInvoices = invoices.filter(invoice => {
    if (invoice.is_deleted) return false;
    
    const matchesSearch = 
      invoice.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.orderFormNo?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.invoiceStatus === statusFilter;
    const matchesService = serviceFilter === 'all' || invoice.serviceName === serviceFilter;
    const matchesClient = clientFilter === 'all' || invoice.customerName === clientFilter;
    const matchesSalesPerson = salesPersonFilter === 'all' || invoice.salesPersonName === salesPersonFilter;
    const matchesRegion = regionFilter === 'all' || invoice.customerRegion === regionFilter;
    
    const matchesInvoiceMonth = invoiceMonthFilter === 'all' || (() => {
      if (!invoice.invoiceDate) return false;
      const invoiceDate = new Date(invoice.invoiceDate);
      return `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}` === invoiceMonthFilter;
    })();
    
    return matchesSearch && matchesStatus && matchesService && matchesClient && matchesSalesPerson && matchesInvoiceMonth && matchesRegion;
  });

  const allColumns = [
    { id: 'invoiceNo', header: "Invoice No", accessor: "invoiceNo", render: (row) => <span className="font-mono font-medium">{row.invoiceNo}</span> },
    { id: 'invoiceDate', header: "Date", accessor: "invoiceDate" },
    { id: 'customerCode', header: "Customer Code", accessor: "customerCode" },
    { id: 'customerName', header: "Customer Name", accessor: "customerName" },
    { id: 'orderFormNo', header: "Order No", accessor: "orderFormNo" },
    { id: 'serviceName', header: "Service", accessor: "serviceName" },
    { id: 'invoiceType', header: "Type", accessor: "invoiceType" },
    { id: 'invoiceNetValue', header: "Net Value", render: (row) => <span>{(row.invoiceNetValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.invoiceCurrency || 'USD' })}</span> },
    { id: 'invoiceTaxValue', header: "Tax Value", render: (row) => <span>{(row.invoiceTaxValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.invoiceCurrency || 'USD' })}</span> },
    { id: 'invoiceValue', header: "Total Value", render: (row) => <span className="font-medium">{(row.invoiceValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.invoiceCurrency || 'USD' })}</span> },
    { id: 'paymentDueDate', header: "Due Date", accessor: "paymentDueDate" },
    { id: 'salesPersonName', header: "Sales Person", accessor: "salesPersonName" },
    { id: 'customerRegion', header: "Region", accessor: "customerRegion" },
    { id: 'status', header: "Status", render: (row) => <StatusBadge status={row.invoiceStatus?.toLowerCase().replace(/ /g, '_')} /> },
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
            <DropdownMenuItem onClick={() => { setViewingInvoice(row); setShowForm(true); }}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingInvoice(row); setViewingInvoice(null); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteInvoice(row)} className="text-rose-600">
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

  const totalNetValue = filteredInvoices.reduce((sum, inv) => {
    const value = inv.invoiceNetValue || 0;
    const rate = currencies.find(c => c.code === (inv.invoiceCurrency || 'INR'))?.exchange_rate || 1;
    return sum + (value * rate);
  }, 0);
  const totalTaxValue = filteredInvoices.reduce((sum, inv) => {
    const value = inv.invoiceTaxValue || 0;
    const rate = currencies.find(c => c.code === (inv.invoiceCurrency || 'INR'))?.exchange_rate || 1;
    return sum + (value * rate);
  }, 0);
  const totalValue = filteredInvoices.reduce((sum, inv) => {
    const value = inv.invoiceValue || 0;
    const rate = currencies.find(c => c.code === (inv.invoiceCurrency || 'INR'))?.exchange_rate || 1;
    return sum + (value * rate);
  }, 0);

  const handleSave = (data) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
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
          title="Invoices" 
          subtitle="Manage customer invoices"
          onAdd={() => { setEditingInvoice(null); setViewingInvoice(null); setShowForm(true); }}
          addLabel="New Invoice"
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
              const headers = ['invoiceNo', 'invoiceDate', 'customerCode', 'customerName', 'orderFormNo', 'serviceName', 'invoiceValue', 'invoiceStatus'];
              const rows = filteredInvoices.map(i => [i.invoiceNo, i.invoiceDate, i.customerCode, i.customerName, i.orderFormNo, i.serviceName, i.invoiceValue, i.invoiceStatus]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div><span className="font-semibold text-slate-900">{invoices.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredInvoices.length}</span> Filtered</div>
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
            searchPlaceholder="Search by invoice no, customer, order no..."
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
                key: 'client',
                value: clientFilter,
                onChange: setClientFilter,
                placeholder: 'Client',
                options: [...new Set(invoices.map(i => i.customerName).filter(Boolean))].map(name => ({
                  value: name,
                  label: name
                }))
              },
              {
                key: 'salesPerson',
                value: salesPersonFilter,
                onChange: setSalesPersonFilter,
                placeholder: 'Sales Person',
                options: [...new Set(invoices.map(i => i.salesPersonName).filter(Boolean))].map(name => ({
                  value: name,
                  label: name
                }))
              },
              {
                key: 'invoiceMonth',
                value: invoiceMonthFilter,
                onChange: setInvoiceMonthFilter,
                placeholder: 'Invoice Month',
                options: [...new Set(invoices.map(i => {
                  if (!i.invoiceDate) return null;
                  const date = new Date(i.invoiceDate);
                  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }).filter(Boolean))].sort().reverse().map(month => {
                  const [year, m] = month.split('-');
                  const monthName = new Date(year, parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return { value: month, label: monthName };
                })
              },
              {
                key: 'region',
                value: regionFilter,
                onChange: setRegionFilter,
                placeholder: 'Region',
                options: [...new Set(invoices.map(i => i.customerRegion).filter(Boolean))].map(region => ({
                  value: region,
                  label: region
                }))
              },
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: 'Invoice Status',
                options: [
                  { value: 'Open', label: 'Open' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Partially paid', label: 'Partially Paid' }
                ]
              }
            ]}
          />
        </div>

        {!isLoading && invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create your first invoice to get started."
            actionLabel="Create Invoice"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns} 
            data={filteredInvoices} 
            isLoading={isLoading}
            emptyMessage="No invoices match your search"
            visibleColumns={visibleColumns}
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <InvoiceForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setViewingInvoice(null);
              setEditingInvoice(null);
            }
          }}
          invoice={viewingInvoice || editingInvoice}
          accounts={accounts}
          salesOrders={salesOrders}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          viewMode={!!viewingInvoice}
        />

        <ConfirmDialog
          open={!!deleteInvoice}
          onOpenChange={() => setDeleteInvoice(null)}
          title="Delete Invoice"
          description={`Are you sure you want to delete invoice "${deleteInvoice?.invoiceNo}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteInvoice.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Invoices"
          description={`Are you sure you want to delete ${selectedRows.length} selected invoice(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="Invoice"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                customerCode: { type: "string" },
                serviceName: { type: "string", enum: ["DaaS", "GaaS", "AI Photoshoot"] },
                orderFormNo: { type: "string" },
                invoiceNo: { type: "string" },
                invoiceDate: { type: "string" },
                invoiceCurrency: { type: "string", enum: ["USD", "INR"] },
                invoiceNetValue: { type: "number" },
                invoiceTaxValue: { type: "number" },
                invoiceValue: { type: "number" },
                invoiceSharedOn: { type: "string" },
                paymentTerms: { type: "string", enum: ["net_7", "net_30", "net_60", "net_90"] },
                paymentDueDate: { type: "string" },
                invoiceStatus: { type: "string", enum: ["Open", "Paid", "Partially paid"] }
              },
              required: ["invoiceNo", "customerCode", "invoiceDate"]
            }
          }}
          templateData={[
            'customerCode,serviceName,orderFormNo,invoiceNo,invoiceDate,invoiceCurrency,invoiceNetValue,invoiceTaxValue,invoiceValue,invoiceSharedOn,paymentTerms,paymentDueDate,invoiceStatus',
            '1000,DaaS,SO-2024-001,INV-2024-001,2024-01-15,USD,10000,1800,11800,2024-01-15,net_30,2024-02-14,Open'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
        />
      </div>
    </div>
  );
}