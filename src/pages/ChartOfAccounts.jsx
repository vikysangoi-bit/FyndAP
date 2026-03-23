import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import AccountForm from "@/components/accounts/AccountForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import BulkDeleteDialog from "@/components/shared/BulkDeleteDialog";
import GoogleSheetsDialog from "@/components/accounts/GoogleSheetsDialog";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, BookOpen, Eye } from "lucide-react";
import SyncDropdown from "@/components/shared/SyncDropdown";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const STORAGE_KEY = 'chartOfAccounts_visibleColumns';

export default function ChartOfAccounts() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showGoogleSheetsImport, setShowGoogleSheetsImport] = useState(false);
  const [showGoogleSheetsExport, setShowGoogleSheetsExport] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [deleteAccount, setDeleteAccount] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [parentAccountFilter, setParentAccountFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const queryClient = useQueryClient();

  const allColumns = [
    { id: 'code', header: "Code", accessor: "code", render: (row) => <span className="font-mono font-medium text-slate-900">{row.code}</span> },
    { id: 'name', header: "Name", accessor: "name", render: (row) => <span className="font-medium">{row.name}</span> },
    { id: 'brand', header: "Brand", accessor: "brand", render: (row) => <span className="text-slate-600">{row.brand || '-'}</span> },
    { id: 'alias', header: "Alias", accessor: "alias", render: (row) => <span className="text-slate-600">{row.alias || '-'}</span> },
    { id: 'type', header: "Type", render: (row) => <span className="capitalize text-slate-600">{row.type}</span> },
    { id: 'category', header: "Category", render: (row) => <span className="text-sm text-slate-500 capitalize">{row.category?.replace(/_/g, ' ')}</span> },
    { id: 'parentAccount', header: "Parent Account", render: (row) => {
      if (!row.parentAccount) return <span className="text-slate-400">-</span>;
      const parent = accounts.find(a => a.id === row.parentAccount);
      return <span className="text-slate-600">{parent ? `${parent.code} - ${parent.name}` : '-'}</span>;
    }},
    { id: 'currency', header: "Currency", accessor: "currency", render: (row) => <span className="text-slate-600">{row.currency || 'USD'}</span> },
    { id: 'openingBalance', header: "Opening Balance", render: (row) => <span className="text-slate-700">{(row.openingBalance || 0).toLocaleString('en-US', { style: 'currency', currency: row.currency || 'USD' })}</span> },
    { id: 'balance', header: "Current Balance", render: (row) => <span className="font-medium text-slate-900">{(row.currentBalance || 0).toLocaleString('en-US', { style: 'currency', currency: row.currency || 'USD' })}</span> },
    { id: 'description', header: "Description", accessor: "description", render: (row) => <span className="text-slate-600 text-sm">{row.description || '-'}</span> },
    { id: 'contactType', header: "Contact Type", render: (row) => <span className="capitalize text-slate-600">{row.contactType || '-'}</span> },
    { id: 'contactPerson', header: "Contact Person", accessor: "contactPerson", render: (row) => <span className="text-slate-600">{row.contactPerson || '-'}</span> },
    { id: 'phone', header: "Phone", accessor: "phone", render: (row) => <span className="text-slate-600">{row.phone || '-'}</span> },
    { id: 'email', header: "Email", accessor: "email", render: (row) => <span className="text-slate-600">{row.email || '-'}</span> },
    { id: 'address', header: "Address", accessor: "address", render: (row) => <span className="text-slate-600 text-sm">{row.address || '-'}</span> },
    { id: 'city', header: "City", accessor: "city", render: (row) => <span className="text-slate-600">{row.city || '-'}</span> },
    { id: 'state', header: "State", accessor: "state", render: (row) => <span className="text-slate-600">{row.state || '-'}</span> },
    { id: 'country', header: "Country", accessor: "country", render: (row) => <span className="text-slate-600">{row.country || '-'}</span> },
    { id: 'region', header: "Region", accessor: "region", render: (row) => <span className="text-slate-600">{row.region || '-'}</span> },
    { id: 'pincode', header: "PIN Code", accessor: "pincode", render: (row) => <span className="text-slate-600">{row.pincode || '-'}</span> },
    { id: 'placeOfSupply', header: "Place of Supply", accessor: "placeOfSupply", render: (row) => <span className="text-slate-600">{row.placeOfSupply || '-'}</span> },
    { id: 'paymentTerms', header: "Payment Terms", render: (row) => <span className="text-slate-600">{row.paymentTerms ? row.paymentTerms.replace(/_/g, ' ').toUpperCase() : '-'}</span> },
    { id: 'creditLimit', header: "Credit Limit", render: (row) => <span className="text-slate-700">{(row.creditLimit || 0).toLocaleString('en-US', { style: 'currency', currency: row.currency || 'USD' })}</span> },
    { id: 'taxId', header: "Tax ID", accessor: "taxId", render: (row) => <span className="text-slate-600 font-mono text-sm">{row.taxId || '-'}</span> },
    { id: 'gstId', header: "GST Number", accessor: "gstId", render: (row) => <span className="text-slate-600 font-mono text-sm">{row.gstId || '-'}</span> },
    { id: 'panId', header: "PAN Number", accessor: "panId", render: (row) => <span className="text-slate-600 font-mono text-sm">{row.panId || '-'}</span> },
    { id: 'tanId', header: "TAN Number", accessor: "tanId", render: (row) => <span className="text-slate-600 font-mono text-sm">{row.tanId || '-'}</span> },
    { id: 'vatId', header: "VAT Number", accessor: "vatId", render: (row) => <span className="text-slate-600 font-mono text-sm">{row.vatId || '-'}</span> },
    { id: 'cinLlpin', header: "CIN/LLPIN", accessor: "cinLlpin", render: (row) => <span className="text-slate-600 font-mono text-sm">{row.cinLlpin || '-'}</span> },
    { id: 'coi', header: "COI", accessor: "coi", render: (row) => <span className="text-slate-600 font-mono text-sm">{row.coi || '-'}</span> },
    { id: 'msme', header: "MSME", accessor: "msme", render: (row) => <span className="text-slate-600">{row.msme || '-'}</span> },
    { id: 'supplierCategory', header: "Vendor Category", render: (row) => <span className="capitalize text-slate-600">{row.supplierCategory?.replace(/_/g, ' ') || '-'}</span> },
    { id: 'status', header: "Status", render: (row) => <StatusBadge status={row.active ? 'active' : 'inactive'} /> },
    {
      id: 'actions',
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
            <DropdownMenuItem onClick={() => { setViewingAccount(row); setShowForm(true); }}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingAccount(row); setViewingAccount(null); setShowForm(true); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDeleteAccount(row)}
              className="text-rose-600"
            >
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
    // Always ensure actions column is included
    if (!savedColumns.includes('actions')) {
      savedColumns.push('actions');
    }
    return savedColumns;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Account.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      
      // Check if user is admin
      if (user.role === 'admin') {
        // Admin can update directly
        await base44.entities.Account.update(id, { ...data, updated_by: user.email });
        
        // Log audit
        await base44.functions.invoke('logAuditEntry', {
          action: 'update',
          entity_type: 'Account',
          entity_id: id,
          entity_name: data.name || data.code,
          details: 'Updated account',
          new_values: data
        });
      } else {
        // Non-admin creates approval request
        await base44.entities.ApprovalRequest.create({
          entity_type: 'account_update',
          entity_id: id,
          title: `Update Account: ${data.name || data.code}`,
          description: `Request to update account ${data.code}`,
          submitted_by: user.email,
          submitted_by_name: user.full_name,
          submitted_at: new Date().toISOString()
        });
        
        alert('Update request submitted for admin approval');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowForm(false);
      setEditingAccount(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      const account = accounts.find(a => a.id === id);
      
      // Check if user is admin
      if (user.role === 'admin') {
        // Admin can delete (soft delete)
        await base44.entities.Account.update(id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        });
        
        // Log audit
        await base44.functions.invoke('logAuditEntry', {
          action: 'delete',
          entity_type: 'Account',
          entity_id: id,
          entity_name: account?.name || account?.code,
          details: 'Deleted account'
        });
      } else {
        // Non-admin creates approval request
        await base44.entities.ApprovalRequest.create({
          entity_type: 'account_delete',
          entity_id: id,
          title: `Delete Account: ${account?.name || account?.code}`,
          description: `Request to delete account ${account?.code}`,
          submitted_by: user.email,
          submitted_by_name: user.full_name,
          submitted_at: new Date().toISOString()
        });
        
        alert('Delete request submitted for admin approval');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setDeleteAccount(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      const user = await base44.auth.me();
      await Promise.all(rows.map(row => 
        base44.entities.Account.update(row.id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredAccounts = accounts.filter(account => {
    // Filter out soft-deleted accounts
    if (account.is_deleted) return false;
    
    const matchesSearch = 
      account.code?.toLowerCase().includes(search.toLowerCase()) ||
      account.name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    const matchesParent = parentAccountFilter === 'all' || 
      (parentAccountFilter === 'main' && !account.parentAccount) ||
      (parentAccountFilter === 'sub' && account.parentAccount) ||
      account.parentAccount === parentAccountFilter;
    const matchesRegion = regionFilter === 'all' || account.region === regionFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && account.active) ||
      (statusFilter === 'inactive' && !account.active);
    return matchesSearch && matchesType && matchesParent && matchesRegion && matchesStatus;
  });

  // Get unique regions and parent accounts for filter options
  const uniqueRegions = [...new Set(accounts.map(a => a.region).filter(Boolean))];
  const mainAccounts = accounts.filter(a => !a.parentAccount);

  const handleSave = (data) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data });
    } else {
      createMutation.mutate({ ...data, currentBalance: data.openingBalance });
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Chart of Accounts" 
          subtitle="Manage your accounting structure"
          onAdd={() => { setEditingAccount(null); setViewingAccount(null); setShowForm(true); }}
          addLabel="New Account"
        >
          <ColumnSelector
            columns={allColumns.filter(c => c.id !== 'actions')}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          <SyncDropdown
            onBulkUpload={() => setShowBulkUpload(true)}
            onBulkDelete={() => setShowBulkDelete(true)}
            onGoogleSheetsImport={() => setShowGoogleSheetsImport(true)}
            onGoogleSheetsExport={() => setShowGoogleSheetsExport(true)}
            onExportToExcel={() => {
              const headers = ['code', 'name', 'type', 'category', 'brand', 'alias', 'parentAccount', 'supplierCategory', 'currency', 'openingBalance', 'currentBalance', 'description', 'contactType', 'contactPerson', 'phone', 'email', 'address', 'city', 'state', 'country', 'region', 'pincode', 'placeOfSupply', 'taxId', 'gstId', 'panId', 'tanId', 'vatId', 'cinLlpin', 'coi', 'msme', 'paymentTerms', 'creditLimit', 'active'];
              const rows = filteredAccounts.map(a => {
                const parentAccount = a.parentAccount ? accounts.find(acc => acc.id === a.parentAccount) : null;
                return [
                  a.code || '', a.name || '', a.type || '', a.category || '', a.brand || '', a.alias || '', 
                  parentAccount ? parentAccount.code : '', a.supplierCategory || '', a.currency || '', 
                  a.openingBalance || 0, a.currentBalance || 0, a.description || '', a.contactType || '', 
                  a.contactPerson || '', a.phone || '', a.email || '', a.address || '', a.city || '', 
                  a.state || '', a.country || '', a.region || '', a.pincode || '', a.placeOfSupply || '', 
                  a.taxId || '', a.gstId || '', a.panId || '', a.tanId || '', a.vatId || '', 
                  a.cinLlpin || '', a.coi || '', a.msme || '', a.paymentTerms || '', a.creditLimit || 0, 
                  a.active ? 'true' : 'false'
                ];
              });
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`;
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
              <div>
                <span className="font-semibold text-slate-900">{accounts.filter(a => !a.is_deleted).length}</span> Total
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div>
                <span className="font-semibold text-slate-900">{filteredAccounts.length}</span> Filtered
              </div>
              {selectedRows.length > 0 && (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <div>
                    <span className="font-semibold text-blue-600">{selectedRows.length}</span> Selected
                  </div>
                </>
              )}
            </div>
          </div>

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by code or name..."
            filters={[
              {
                key: 'type',
                value: typeFilter,
                onChange: setTypeFilter,
                placeholder: 'Type',
                options: [
                  { value: 'asset', label: 'Asset' },
                  { value: 'liability', label: 'Liability' },
                  { value: 'equity', label: 'Equity' },
                  { value: 'revenue', label: 'Revenue' },
                  { value: 'expense', label: 'Expense' },
                ]
              },
              {
                key: 'parent',
                value: parentAccountFilter,
                onChange: setParentAccountFilter,
                placeholder: 'Parent Account',
                options: [
                  { value: 'main', label: 'Main Accounts' },
                  { value: 'sub', label: 'Sub Accounts' },
                  ...mainAccounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))
                ]
              },
              {
                key: 'region',
                value: regionFilter,
                onChange: setRegionFilter,
                placeholder: 'Region',
                options: uniqueRegions.map(r => ({ value: r, label: r }))
              },
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: 'Status',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]
              }
            ]}
          />
        </div>

        {!isLoading && accounts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No accounts yet"
            description="Create your first account to start building your chart of accounts."
            actionLabel="Create Account"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns} 
            data={filteredAccounts} 
            isLoading={isLoading}
            emptyMessage="No accounts match your search"
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            visibleColumns={visibleColumns}
          />
        )}

        <AccountForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setViewingAccount(null);
              setEditingAccount(null);
            }
          }}
          account={viewingAccount || editingAccount}
          accounts={accounts}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          viewMode={!!viewingAccount}
        />

        <ConfirmDialog
          open={!!deleteAccount}
          onOpenChange={() => setDeleteAccount(null)}
          title="Delete Account"
          description={`Are you sure you want to delete "${deleteAccount?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteAccount.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Accounts"
          description={`Are you sure you want to delete ${selectedRows.length} selected account(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkDeleteDialog
          open={showBulkDelete}
          onOpenChange={setShowBulkDelete}
          entityName="Account"
          identifierField="code"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}
        />

        <GoogleSheetsDialog
          open={showGoogleSheetsImport}
          onOpenChange={setShowGoogleSheetsImport}
          mode="import"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}
        />

        <GoogleSheetsDialog
          open={showGoogleSheetsExport}
          onOpenChange={setShowGoogleSheetsExport}
          mode="export"
          onSuccess={() => {}}
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="Account"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                name: { type: "string" },
                brand: { type: "string" },
                alias: { type: "string" },
                type: { type: "string", enum: ["asset", "liability", "equity", "revenue", "expense"] },
                category: { type: "string", enum: ["current_asset", "fixed_asset", "current_liability", "long_term_liability", "equity", "operating_revenue", "other_revenue", "cost_of_goods", "operating_expense", "other_expense"] },
                parentAccount: { type: "string" },
                supplierCategory: { type: "string", enum: ["fabric", "trims", "accessories", "packaging", "services", "other"] },
                currency: { type: "string" },
                openingBalance: { type: "number" },
                currentBalance: { type: "number" },
                description: { type: "string" },
                contactType: { type: "string", enum: ["business", "finance", "operations"] },
                contactPerson: { type: "string" },
                phone: { type: "string" },
                email: { type: "string", format: "email" },
                address: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
                region: { type: "string" },
                pincode: { type: "string" },
                placeOfSupply: { type: "string" },
                taxId: { type: "string" },
                gstId: { type: "string" },
                panId: { type: "string" },
                tanId: { type: "string" },
                vatId: { type: "string" },
                cinLlpin: { type: "string" },
                coi: { type: "string" },
                msme: { type: "string", enum: ["Micro", "Small", "Medium", "Large"] },
                paymentTerms: { type: "string", enum: ["net_7", "net_15", "net_30", "net_45", "net_60", "net_90", "cod", "advance"] },
                creditLimit: { type: "number" },
                active: { type: "boolean" }
              },
              required: ["code", "name", "type", "category"]
            }
          }}
          templateData={[
            'code,name,type,category,brand,alias,parentAccount,supplierCategory,currency,openingBalance,description,contactType,contactPerson,phone,email,address,city,state,country,region,pincode,placeOfSupply,taxId,gstId,panId,tanId,vatId,cinLlpin,coi,msme,paymentTerms,creditLimit,active',
            '1000,Cash,asset,current_asset,ABC Corp,Cash Account,,,USD,10000,Main cash account,business,John Doe,+919876543210,john@example.com,123 Business St,Mumbai,Maharashtra,India,Western India,400001,Maharashtra,TAX123,22AAAAA0000A1Z5,ABCDE1234F,ABCD12345E,GB123456789,U12345AB1234ABC123456,COI789,,net_30,50000,true',
            '2000,Accounts Payable,liability,current_liability,XYZ Ltd,AP Account,,,USD,0,Supplier payables,finance,Jane Smith,+919876543211,jane@example.com,456 Finance Ave,Delhi,Delhi,India,Northern India,110001,Delhi,TAX456,,,,,,,,,net_30,0,true',
            '3000,Sales Revenue,revenue,operating_revenue,,,,,USD,0,Sales income,,,,,,,,India,,,,,,,,,,,,true',
            '4000,Cost of Goods Sold,expense,cost_of_goods,,,fabric,,USD,0,Material costs,,,,,,,,India,,,,,,,,,,,,true',
            '5000,Operating Expenses,expense,operating_expense,,,,,USD,0,Daily operations,,,,,,,,India,,,,,,,,,,,,true'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}
        />
      </div>
    </div>
  );
}