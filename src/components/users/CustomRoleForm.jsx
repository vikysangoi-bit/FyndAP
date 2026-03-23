import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
  {
    id: "order_to_cash",
    name: "Order to Cash",
    subModules: [
      { id: "sales_orders", name: "Sales Orders" },
      { id: "invoices", name: "Invoices" },
      { id: "credit_notes", name: "Credit Notes" },
      { id: "receipts", name: "Receipts" }
    ]
  },
  {
    id: "procure_to_pay",
    name: "Procure to Pay",
    subModules: [
      { id: "purchase_orders", name: "Purchase Orders" },
      { id: "goods_receipts", name: "Goods Receipts" },
      { id: "vendor_bills", name: "Vendor Bills" },
      { id: "debit_notes", name: "Debit Notes" },
      { id: "payments", name: "Payments" }
    ]
  },
  {
    id: "accounting",
    name: "Accounting",
    subModules: [
      { id: "chart_of_accounts", name: "Chart of Accounts" },
      { id: "journal_entries", name: "Journal Entries" }
    ]
  },
  {
    id: "inventory",
    name: "Inventory",
    subModules: [
      { id: "items", name: "Items" },
      { id: "transactions", name: "Transactions" }
    ]
  },
  {
    id: "reports",
    name: "Reports",
    subModules: [
      { id: "view", name: "View Reports" }
    ]
  }
];

const approverForms = [
  { value: "sales_orders", label: "Sales Orders" },
  { value: "purchase_orders", label: "Purchase Orders" },
  { value: "journal_entries", label: "Journal Entries" },
  { value: "inventory_transactions", label: "Inventory Transactions" },
  { value: "vendor_bills", label: "Vendor Bills" }
];

export default function CustomRoleForm({ open, onOpenChange, role, onSave, isLoading }) {
  const [form, setForm] = useState({
    role_name: '',
    description: '',
    permissions: {},
    approver_for: [],
    is_active: true
  });

  useEffect(() => {
    if (role) {
      setForm(role);
    } else {
      const defaultPermissions = {};
      modules.forEach(module => {
        defaultPermissions[module.id] = {};
        module.subModules.forEach(sub => {
          if (module.id === 'reports') {
            defaultPermissions[module.id][sub.id] = false;
          } else {
            defaultPermissions[module.id][sub.id] = {
              view: false,
              edit: false,
              delete: false
            };
          }
        });
      });
      setForm({
        role_name: '',
        description: '',
        permissions: defaultPermissions,
        approver_for: [],
        is_active: true
      });
    }
  }, [role, open]);

  const handlePermissionChange = (moduleId, subModuleId, permission, value) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId],
          [subModuleId]: moduleId === 'reports' 
            ? value 
            : {
                ...prev.permissions[moduleId][subModuleId],
                [permission]: value
              }
        }
      }
    }));
  };

  const handleApproverToggle = (formType) => {
    setForm(prev => ({
      ...prev,
      approver_for: prev.approver_for.includes(formType)
        ? prev.approver_for.filter(f => f !== formType)
        : [...prev.approver_for, formType]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Custom Role' : 'Create Custom Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role_name">Role Name *</Label>
              <Input
                id="role_name"
                value={form.role_name}
                onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                placeholder="e.g., Sales Manager, Accountant"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
          </div>

          <Tabs defaultValue="permissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="permissions">Module Permissions</TabsTrigger>
              <TabsTrigger value="approver">Approver Rights</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              {modules.map(module => (
                <Card key={module.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{module.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {module.subModules.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                          <div className="flex items-center gap-6">
                            {module.id === 'reports' ? (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={form.permissions[module.id]?.[sub.id] || false}
                                  onCheckedChange={(checked) => handlePermissionChange(module.id, sub.id, null, checked)}
                                />
                                <span className="text-sm text-slate-600">View</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={form.permissions[module.id]?.[sub.id]?.view || false}
                                    onCheckedChange={(checked) => handlePermissionChange(module.id, sub.id, 'view', checked)}
                                  />
                                  <span className="text-sm text-slate-600">View</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={form.permissions[module.id]?.[sub.id]?.edit || false}
                                    onCheckedChange={(checked) => handlePermissionChange(module.id, sub.id, 'edit', checked)}
                                  />
                                  <span className="text-sm text-slate-600">Edit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={form.permissions[module.id]?.[sub.id]?.delete || false}
                                    onCheckedChange={(checked) => handlePermissionChange(module.id, sub.id, 'delete', checked)}
                                  />
                                  <span className="text-sm text-slate-600">Delete</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="approver" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Approval Rights</CardTitle>
                  <CardDescription>Select which forms this role can approve</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approverForms.map(formType => (
                      <div key={formType.value} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">{formType.label}</span>
                        <Checkbox
                          checked={form.approver_for?.includes(formType.value) || false}
                          onCheckedChange={() => handleApproverToggle(formType.value)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}