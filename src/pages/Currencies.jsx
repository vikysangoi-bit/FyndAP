import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Coins, Star } from "lucide-react";
import { format } from "date-fns";

export default function Currencies() {
  const [showForm, setShowForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [deleteCurrency, setDeleteCurrency] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    symbol: '',
    exchange_rate: 1,
    is_base: false,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Currency.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Currency.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Currency.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      setDeleteCurrency(null);
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingCurrency(null);
    setForm({
      code: '',
      name: '',
      symbol: '',
      exchange_rate: 1,
      is_base: false,
      is_active: true
    });
  };

  const openEdit = (currency) => {
    setEditingCurrency(currency);
    setForm(currency);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, last_updated: new Date().toISOString() };
    if (editingCurrency) {
      updateMutation.mutate({ id: editingCurrency.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { 
      header: "Code", 
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900">{row.code}</span>
          {row.is_base && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
        </div>
      )
    },
    { header: "Name", accessor: "name", render: (row) => <span className="font-medium">{row.name}</span> },
    { 
      header: "Symbol", 
      render: (row) => <span className="text-lg">{row.symbol}</span>
    },
    { 
      header: "Exchange Rate", 
      render: (row) => (
        <span className="font-medium">
          {row.is_base ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Base Currency</Badge>
          ) : (
            row.exchange_rate?.toFixed(4)
          )}
        </span>
      )
    },
    { 
      header: "Last Updated", 
      render: (row) => (
        <span className="text-slate-500 text-sm">
          {row.last_updated ? format(new Date(row.last_updated), 'MMM d, yyyy h:mm a') : '-'}
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
            <DropdownMenuItem onClick={() => openEdit(row)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {!row.is_base && (
              <DropdownMenuItem onClick={() => setDeleteCurrency(row)} className="text-rose-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader 
          title="Currencies" 
          subtitle="Manage currencies and exchange rates"
          onAdd={() => { resetForm(); setShowForm(true); }}
          addLabel="Add Currency"
        />

        {!isLoading && currencies.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No currencies configured"
            description="Add your first currency to enable multi-currency support."
            actionLabel="Add Currency"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={currencies} 
            isLoading={isLoading}
            emptyMessage="No currencies found"
          />
        )}

        {/* Currency Form Dialog */}
        <Dialog open={showForm} onOpenChange={resetForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCurrency ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Currency Code *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="USD"
                    maxLength={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                    placeholder="$"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Currency Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="US Dollar"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange_rate">Exchange Rate to Base</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.0001"
                  value={form.exchange_rate}
                  onChange={(e) => setForm({ ...form, exchange_rate: parseFloat(e.target.value) || 1 })}
                  disabled={form.is_base}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_base">Set as Base Currency</Label>
                <Switch
                  id="is_base"
                  checked={form.is_base}
                  onCheckedChange={(v) => setForm({ ...form, is_base: v, exchange_rate: v ? 1 : form.exchange_rate })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-slate-900 hover:bg-slate-800">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCurrency ? 'Update' : 'Add')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteCurrency}
          onOpenChange={() => setDeleteCurrency(null)}
          title="Delete Currency"
          description={`Are you sure you want to delete "${deleteCurrency?.name}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteCurrency.id)}
          variant="destructive"
        />
      </div>
    </div>
  );
}