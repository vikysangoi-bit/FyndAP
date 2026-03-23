import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import SupplierForm from "@/components/suppliers/SupplierForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Building2, Star, Mail, Phone, Upload } from "lucide-react";

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteSupplier, setDeleteSupplier] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false);
      setEditingSupplier(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteSupplier(null);
    }
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.code?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.name?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    { 
      header: "Supplier", 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <Building2 className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{row.name}</span>
              {row.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-slate-500">{row.rating}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500">{row.code}</p>
          </div>
        </div>
      )
    },
    { 
      header: "Category", 
      render: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.category?.replace(/_/g, ' ')}
        </Badge>
      )
    },
    { 
      header: "Contact", 
      render: (row) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-3 h-3" />
              <span>{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      )
    },
    { 
      header: "Location", 
      render: (row) => (
        <span className="text-slate-600">
          {[row.city, row.country].filter(Boolean).join(', ') || '-'}
        </span>
      )
    },
    { 
      header: "Payment Terms", 
      render: (row) => (
        <span className="text-slate-600 capitalize">
          {row.payment_terms?.replace(/_/g, ' ')}
        </span>
      )
    },
    { 
      header: "Balance", 
      render: (row) => (
        <span className="font-medium">
          {row.currency} {(row.current_balance || 0).toFixed(2)}
        </span>
      )
    },
    { 
      header: "Status", 
      render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
    },
    {
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
            <DropdownMenuItem onClick={() => { setEditingSupplier(row); setShowForm(true); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteSupplier(row)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const handleSave = (data) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Suppliers" 
          subtitle="Manage your supplier network"
          onAdd={() => { setEditingSupplier(null); setShowForm(true); }}
          addLabel="New Supplier"
          onExport={() => {
            const headers = ['Code', 'Name', 'Contact Person', 'Email', 'Phone', 'Address', 'City', 'Country', 'Payment Terms', 'Currency', 'Credit Limit', 'Current Balance', 'Tax ID', 'Category', 'Rating', 'Is Active', 'Notes'];
            const rows = filteredSuppliers.map(s => [
              s.code, s.name, s.contact_person || '', s.email || '', s.phone || '', s.address || '', 
              s.city || '', s.country || '', s.payment_terms || '', s.currency || 'USD', s.credit_limit || 0, 
              s.current_balance || 0, s.tax_id || '', s.category || '', s.rating || '', 
              s.is_active ? 'Yes' : 'No', s.notes || ''
            ]);
            const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
        >
          <Button variant="outline" onClick={() => setShowBulkUpload(true)} className="border-slate-200">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        </PageHeader>

        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by code, name, contact..."
          filters={[
            {
              key: 'category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              placeholder: 'Category',
              options: [
                { value: 'fabric', label: 'Fabric' },
                { value: 'trims', label: 'Trims' },
                { value: 'accessories', label: 'Accessories' },
                { value: 'packaging', label: 'Packaging' },
                { value: 'services', label: 'Services' },
                { value: 'other', label: 'Other' },
              ]
            }
          ]}
        />

        {!isLoading && suppliers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No suppliers"
            description="Add your first supplier to start managing purchase orders."
            actionLabel="Add Supplier"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredSuppliers} 
            isLoading={isLoading}
            emptyMessage="No suppliers match your search"
          />
        )}

        <SupplierForm
          open={showForm}
          onOpenChange={setShowForm}
          supplier={editingSupplier}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <ConfirmDialog
          open={!!deleteSupplier}
          onOpenChange={() => setDeleteSupplier(null)}
          title="Delete Supplier"
          description={`Are you sure you want to delete "${deleteSupplier?.name}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteSupplier.id)}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="Supplier"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                name: { type: "string" },
                contact_person: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                city: { type: "string" },
                country: { type: "string" },
                payment_terms: { type: "string" },
                currency: { type: "string" },
                credit_limit: { type: "number" },
                category: { type: "string" },
                is_active: { type: "boolean" }
              },
              required: ["code", "name"]
            }
          }}
          templateData={[
            'code,name,contact_person,email,phone,address,city,country,payment_terms,currency,credit_limit,tax_id,category,rating,is_active,notes',
            'SUP-001,ABC Textiles,John Doe,john@abc.com,+1234567890,123 Main St,Mumbai,India,net_30,USD,50000,TAX123,fabric,4,true,',
            'SUP-002,XYZ Trims,Jane Smith,jane@xyz.com,+0987654321,456 Market Rd,Dhaka,Bangladesh,net_45,USD,30000,TAX456,trims,5,true,'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })}
        />
      </div>
    </div>
  );
}