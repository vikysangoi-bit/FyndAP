import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import CustomRoleForm from "@/components/users/CustomRoleForm";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Shield, Users } from "lucide-react";

export default function CustomRoles() {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteRole, setDeleteRole] = useState(null);

  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['custom-roles'],
    queryFn: () => base44.entities.CustomRole.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomRole.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      setShowForm(false);
      setEditingRole(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      setDeleteRole(null);
    }
  });

  const columns = [
    { 
      id: "role_name",
      header: "Role Name", 
      render: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{row.role_name}</span>
        </div>
      )
    },
    { 
      id: "description",
      header: "Description", 
      render: (row) => <span className="text-slate-600">{row.description || '-'}</span>
    },
    { 
      id: "approver_for",
      header: "Approver Rights", 
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.approver_for?.length > 0 ? (
            row.approver_for.map(form => (
              <Badge key={form} variant="outline" className="text-xs capitalize">
                {form.replace(/_/g, ' ')}
              </Badge>
            ))
          ) : (
            <span className="text-slate-400 text-sm">None</span>
          )}
        </div>
      )
    },
    { 
      id: "is_active",
      header: "Status", 
      render: (row) => (
        <Badge variant={row.is_active ? "default" : "secondary"}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
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
            <DropdownMenuItem onClick={() => { setEditingRole(row); setShowForm(true); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteRole(row)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const handleSave = (data) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Custom Roles" 
          subtitle="Create and manage custom roles with specific permissions"
          onAdd={() => { setEditingRole(null); setShowForm(true); }}
          addLabel="New Role"
        />

        {!isLoading && roles.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No custom roles"
            description="Create custom roles to assign specific permissions to users."
            actionLabel="Create Role"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={columns}
            data={roles} 
            isLoading={isLoading}
            emptyMessage="No roles found"
          />
        )}

        <CustomRoleForm
          open={showForm}
          onOpenChange={setShowForm}
          role={editingRole}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <ConfirmDialog
          open={!!deleteRole}
          onOpenChange={() => setDeleteRole(null)}
          title="Delete Custom Role"
          description={`Are you sure you want to delete "${deleteRole?.role_name}"? Users with this role will lose their custom permissions.`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteRole.id)}
          variant="destructive"
        />
      </div>
    </div>
  );
}