import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import AssignRoleDialog from "@/components/users/AssignRoleDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users as UsersIcon, UserPlus, Mail, Shield, MoreHorizontal, Settings, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Users() {
  const [showInvite, setShowInvite] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user' });

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowInvite(false);
      setInviteForm({ email: '', role: 'user' });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAssignRole(false);
      setSelectedUser(null);
    }
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const columns = [
    { 
      header: "User", 
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white font-medium">
              {getInitials(row.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-slate-900">{row.full_name || 'No name'}</p>
            <p className="text-sm text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      header: "Role", 
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Badge 
            variant="outline" 
            className={row.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-700 border-slate-200'}
          >
            <Shield className="w-3 h-3 mr-1" />
            {row.role === 'admin' ? 'Admin' : 'User'}
          </Badge>
          {row.custom_role_name && (
            <Badge variant="secondary" className="text-xs">
              {row.custom_role_name}
            </Badge>
          )}
        </div>
      )
    },
    { 
      header: "Joined", 
      render: (row) => (
        <span className="text-slate-500">
          {row.created_date ? format(new Date(row.created_date), 'MMM d, yyyy') : '-'}
        </span>
      )
    },
    { 
      header: "Last Active", 
      render: (row) => (
        <span className="text-slate-500">
          {row.updated_date ? format(new Date(row.updated_date), 'MMM d, yyyy') : '-'}
        </span>
      )
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
            <DropdownMenuItem onClick={() => { setSelectedUser(row); setShowAssignRole(true); }}>
              <Settings className="w-4 h-4 mr-2" />
              Assign Custom Role
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const handleInvite = (e) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader 
          title="User Management" 
          subtitle="Manage team members and access"
          onAdd={isAdmin ? () => setShowInvite(true) : undefined}
          addLabel="Invite User"
        >
          {isAdmin && (
            <Link to={createPageUrl('CustomRoles')}>
              <Button variant="outline" className="border-slate-200">
                <Shield className="w-4 h-4 mr-2" />
                Manage Roles
              </Button>
            </Link>
          )}
        </PageHeader>

        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search users..."
          filters={[
            {
              key: 'role',
              value: roleFilter,
              onChange: setRoleFilter,
              placeholder: 'Role',
              options: [
                { value: 'admin', label: 'Admin' },
                { value: 'user', label: 'User' },
              ]
            }
          ]}
        />

        {!isLoading && users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users yet"
            description="Invite your first team member to get started."
            actionLabel="Invite User"
            onAction={() => setShowInvite(true)}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredUsers} 
            isLoading={isLoading}
            emptyMessage="No users match your search"
          />
        )}

        {/* Invite Dialog */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite User
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User - Standard access</SelectItem>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                <p><strong>User:</strong> Can create and edit records, submit for approval</p>
                <p><strong>Admin:</strong> Full access including approvals and user management</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending} className="bg-slate-900 hover:bg-slate-800">
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AssignRoleDialog
          open={showAssignRole}
          onOpenChange={setShowAssignRole}
          user={selectedUser}
          onSave={(data) => updateUserMutation.mutate({ id: selectedUser.id, data })}
          isLoading={updateUserMutation.isPending}
        />
      </div>
    </div>
  );
}