import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { ScrollText, FileText, Package, User, Settings } from "lucide-react";
import { format } from "date-fns";

const actionConfig = {
  create: { label: "Created", color: "bg-emerald-100 text-emerald-700" },
  update: { label: "Updated", color: "bg-blue-100 text-blue-700" },
  delete: { label: "Deleted", color: "bg-rose-100 text-rose-700" },
  approve: { label: "Approved", color: "bg-green-100 text-green-700" },
  reject: { label: "Rejected", color: "bg-amber-100 text-amber-700" },
  login: { label: "Login", color: "bg-purple-100 text-purple-700" },
  export: { label: "Exported", color: "bg-cyan-100 text-cyan-700" },
  import: { label: "Imported", color: "bg-indigo-100 text-indigo-700" },
};

const entityIcons = {
  journal_entry: FileText,
  inventory_transaction: Package,
  user: User,
  account: Settings,
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100)
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const columns = [
    { 
      header: "Timestamp", 
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.created_date ? format(new Date(row.created_date), 'MMM d, yyyy h:mm a') : '-'}
        </span>
      )
    },
    { 
      header: "Action", 
      render: (row) => {
        const config = actionConfig[row.action] || { label: row.action, color: "bg-slate-100 text-slate-700" };
        return (
          <Badge className={`${config.color} border-0`}>
            {config.label}
          </Badge>
        );
      }
    },
    { 
      header: "Entity", 
      render: (row) => {
        const Icon = entityIcons[row.entity_type] || FileText;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-500 capitalize">{row.entity_type?.replace(/_/g, ' ')}</span>
              {row.entity_name && (
                <p className="text-sm font-medium text-slate-900 truncate max-w-xs">{row.entity_name}</p>
              )}
            </div>
          </div>
        );
      }
    },
    { 
      header: "User", 
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.user_name || '-'}</p>
          <p className="text-sm text-slate-500">{row.user_email}</p>
        </div>
      )
    },
    { 
      header: "Details", 
      render: (row) => (
        <span className="text-sm text-slate-600 truncate block max-w-xs">{row.details || '-'}</span>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Audit Logs" 
          subtitle="Track all system activity"
        />

        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search logs..."
          filters={[
            {
              key: 'action',
              value: actionFilter,
              onChange: setActionFilter,
              placeholder: 'Action',
              options: Object.entries(actionConfig).map(([value, { label }]) => ({ value, label }))
            }
          ]}
        />

        {!isLoading && logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No audit logs"
            description="Activity logs will appear here as users interact with the system."
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredLogs} 
            isLoading={isLoading}
            emptyMessage="No logs match your search"
          />
        )}
      </div>
    </div>
  );
}