import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";

export default function AssignRoleDialog({ open, onOpenChange, user, onSave, isLoading }) {
  const [selectedRole, setSelectedRole] = useState('');

  const { data: customRoles = [] } = useQuery({
    queryKey: ['custom-roles'],
    queryFn: () => base44.entities.CustomRole.filter({ is_active: true })
  });

  useEffect(() => {
    if (user) {
      setSelectedRole(user.custom_role_id || '');
    }
  }, [user, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const role = customRoles.find(r => r.id === selectedRole);
    onSave({
      custom_role_id: selectedRole || null,
      custom_role_name: role?.role_name || null
    });
  };

  const selectedRoleData = customRoles.find(r => r.id === selectedRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Custom Role to {user?.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Custom Role (Default Permissions)</SelectItem>
                {customRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoleData && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div>
                <Label className="text-sm text-slate-600">Description</Label>
                <p className="text-sm text-slate-900">{selectedRoleData.description || 'No description'}</p>
              </div>
              {selectedRoleData.approver_for?.length > 0 && (
                <div>
                  <Label className="text-sm text-slate-600">Approver For</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoleData.approver_for.map(form => (
                      <Badge key={form} variant="outline" className="capitalize">
                        {form.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading ? 'Saving...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}