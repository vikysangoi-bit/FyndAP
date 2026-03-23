import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, FileText, Send, Eye } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

export default function JournalEntries() {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [viewEntry, setViewEntry] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date')
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JournalEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setShowForm(false);
      setEditingEntry(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JournalEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setDeleteEntry(null);
    }
  });

  const submitForApproval = async (entry) => {
    await base44.entities.JournalEntry.update(entry.id, {
      status: 'pending_approval',
      submitted_by: user?.email,
      submitted_at: new Date().toISOString()
    });
    
    await base44.entities.ApprovalRequest.create({
      entity_type: 'journal_entry',
      entity_id: entry.id,
      title: `Journal Entry: ${entry.description}`,
      description: `Entry dated ${entry.entry_date} with ${entry.lines?.length || 0} lines`,
      amount: entry.total_debit,
      currency: entry.currency,
      status: 'pending',
      submitted_by: user?.email,
      submitted_by_name: user?.full_name,
      submitted_at: new Date().toISOString()
    });
    
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.entry_number?.toLowerCase().includes(search.toLowerCase()) ||
      entry.description?.toLowerCase().includes(search.toLowerCase()) ||
      entry.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generateEntryNumber = () => {
    const count = entries.length + 1;
    return `JE-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
  };

  const columns = [
    { 
      header: "Entry #", 
      render: (row) => (
        <span className="font-mono font-medium text-slate-900">{row.entry_number || '-'}</span>
      )
    },
    { 
      header: "Date", 
      render: (row) => row.entry_date ? format(new Date(row.entry_date), 'MMM d, yyyy') : '-'
    },
    { 
      header: "Description", 
      render: (row) => (
        <span className="font-medium text-slate-700 truncate block max-w-xs">{row.description}</span>
      )
    },
    { header: "Reference", accessor: "reference", render: (row) => <span className="text-slate-500">{row.reference || '-'}</span> },
    { 
      header: "Debit", 
      render: (row) => (
        <span className="font-medium">
          {row.currency} {(row.total_debit || 0).toFixed(2)}
        </span>
      )
    },
    { 
      header: "Credit", 
      render: (row) => (
        <span className="font-medium">
          {row.currency} {(row.total_credit || 0).toFixed(2)}
        </span>
      )
    },
    { 
      header: "Status", 
      render: (row) => <StatusBadge status={row.status || 'draft'} />
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
            <DropdownMenuItem onClick={() => setViewEntry(row)}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            {row.status === 'draft' && (
              <>
                <DropdownMenuItem onClick={() => { setEditingEntry(row); setShowForm(true); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => submitForApproval(row)}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Approval
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteEntry(row)} className="text-rose-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const handleSave = (data) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate({ ...data, entry_number: generateEntryNumber(), status: 'draft' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Journal Entries" 
          subtitle="Record and manage accounting entries"
          onAdd={() => { setEditingEntry(null); setShowForm(true); }}
          addLabel="New Entry"
          onExport={() => {
            const headers = ['Entry Number', 'Entry Date', 'Description', 'Reference', 'Currency', 'Total Debit', 'Total Credit', 'Status'];
            const rows = filteredEntries.map(e => [
              e.entry_number || '', e.entry_date || '', e.description || '', e.reference || '', 
              e.currency || 'USD', e.total_debit || 0, e.total_credit || 0, e.status || 'draft'
            ]);
            const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `journal_entries_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
        />

        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by entry number, description..."
          filters={[
            {
              key: 'status',
              value: statusFilter,
              onChange: setStatusFilter,
              placeholder: 'Status',
              options: [
                { value: 'draft', label: 'Draft' },
                { value: 'pending_approval', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'posted', label: 'Posted' },
              ]
            }
          ]}
        />

        {!isLoading && entries.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No journal entries"
            description="Create your first journal entry to start recording transactions."
            actionLabel="Create Entry"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredEntries} 
            isLoading={isLoading}
            emptyMessage="No entries match your search"
          />
        )}

        <JournalEntryForm
          open={showForm}
          onOpenChange={setShowForm}
          entry={editingEntry}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <ConfirmDialog
          open={!!deleteEntry}
          onOpenChange={() => setDeleteEntry(null)}
          title="Delete Journal Entry"
          description={`Are you sure you want to delete this entry? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteEntry.id)}
          variant="destructive"
        />

        {/* View Entry Dialog */}
        <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Journal Entry Details</DialogTitle>
            </DialogHeader>
            {viewEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Entry Number</p>
                    <p className="font-medium">{viewEntry.entry_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date</p>
                    <p className="font-medium">{viewEntry.entry_date ? format(new Date(viewEntry.entry_date), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="font-medium">{viewEntry.description}</p>
                  </div>
                </div>
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Entry Lines</h4>
                  <div className="space-y-2">
                    {viewEntry.lines?.map((line, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 text-sm py-2 border-b last:border-0">
                        <span className="col-span-2">{line.account_code} - {line.account_name}</span>
                        <span className="text-right">{line.debit > 0 ? line.debit.toFixed(2) : ''}</span>
                        <span className="text-right">{line.credit > 0 ? line.credit.toFixed(2) : ''}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-2 pt-2 font-semibold">
                      <span className="col-span-2">Total</span>
                      <span className="text-right">{viewEntry.total_debit?.toFixed(2)}</span>
                      <span className="text-right">{viewEntry.total_credit?.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}