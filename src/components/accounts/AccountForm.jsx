import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CurrencySelect from "../shared/CurrencySelect";

const accountTypes = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
];

const categoryOptions = {
  asset: [
    { value: "current_asset", label: "Current Asset" },
    { value: "fixed_asset", label: "Fixed Asset" },
  ],
  liability: [
    { value: "current_liability", label: "Current Liability" },
    { value: "long_term_liability", label: "Long-term Liability" },
  ],
  equity: [{ value: "equity", label: "Equity" }],
  revenue: [
    { value: "operating_revenue", label: "Operating Revenue" },
    { value: "other_revenue", label: "Other Revenue" },
  ],
  expense: [
    { value: "cost_of_goods", label: "Cost of Goods Sold" },
    { value: "operating_expense", label: "Operating Expense" },
    { value: "other_expense", label: "Other Expense" },
  ],
};

export default function AccountForm({ open, onOpenChange, account, accounts = [], onSave, isLoading, viewMode = false }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    brand: '',
    alias: '',
    type: 'asset',
    category: 'current_asset',
    parentAccount: '',
    currency: 'USD',
    openingBalance: 0,
    active: true,
    description: '',
    contactType: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    region: '',
    pincode: '',
    placeOfSupply: '',
    paymentTerms: '',
    creditLimit: 0,
    taxId: '',
    gstId: '',
    panId: '',
    tanId: '',
    vatId: '',
    cinLlpin: '',
    coi: '',
    supplierCategory: '',
    msme: ''
  });
  
  const [accountLevel, setAccountLevel] = useState('main');

  useEffect(() => {
    if (account) {
      console.log('Account loaded:', account);
      setForm(account);
      setAccountLevel(account.parentAccount ? 'sub' : 'main');
    } else {
      setAccountLevel('main');
      
      // Auto-generate next account code
      const fcAccounts = accounts
        .filter(a => a.code?.startsWith('FC'))
        .map(a => {
          const numPart = a.code.replace('FC', '');
          return parseInt(numPart) || 0;
        })
        .filter(n => !isNaN(n));
      
      const maxNumber = fcAccounts.length > 0 ? Math.max(...fcAccounts) : 74;
      const nextNumber = maxNumber + 1;
      const nextCode = `FC${String(nextNumber).padStart(5, '0')}`;
      
      setForm({
        code: nextCode,
        name: '',
        brand: '',
        alias: '',
        type: 'asset',
        category: 'current_asset',
        parentAccount: '',
        currency: 'USD',
        openingBalance: 0,
        active: true,
        description: '',
        contactType: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        country: '',
        region: '',
        pincode: '',
        placeOfSupply: '',
        paymentTerms: '',
        creditLimit: 0,
        taxId: '',
        gstId: '',
        panId: '',
        tanId: '',
        vatId: '',
        cinLlpin: '',
        coi: '',
        supplierCategory: '',
        msme: ''
      });
    }
  }, [account, open, accounts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!viewMode) {
      onSave(form);
    }
  };

  const parentAccounts = accounts.filter(a => a.type === form.type && a.id !== account?.id && !a.parentAccount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewMode ? 'View Account' : (account ? 'Edit Account' : 'New Account')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Account Code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g., 1001"
                required
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Cash in Bank"
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={form.brand || ''}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g., ABC Corporation"
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input
                id="alias"
                value={form.alias || ''}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
                placeholder="e.g., Short name"
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select 
                value={form.type} 
                onValueChange={(v) => {
                  const newCategory = form.category && categoryOptions[v]?.some(opt => opt.value === form.category) 
                    ? form.category 
                    : categoryOptions[v][0].value;
                  console.log('Account type changed to:', v, 'new category:', newCategory);
                  setForm({ ...form, type: v, category: newCategory });
                }}
                disabled={viewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => {
                console.log('Category changed to:', v);
                setForm({ ...form, category: v });
              }} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions[form.type]?.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Account Level</Label>
              <RadioGroup 
                value={accountLevel} 
                onValueChange={(v) => {
                  setAccountLevel(v);
                  if (v === 'main') setForm({ ...form, parentAccount: '' });
                }}
                disabled={viewMode}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="main" id="main" disabled={viewMode} />
                  <Label htmlFor="main" className="font-normal cursor-pointer">Main Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sub" id="sub" disabled={viewMode} />
                  <Label htmlFor="sub" className="font-normal cursor-pointer">Sub-Category</Label>
                </div>
              </RadioGroup>
            </div>

            {accountLevel === 'sub' && (
              <div className="space-y-2">
                <Label>Parent Account</Label>
                <Select 
                  value={form.parentAccount || ''} 
                  onValueChange={(v) => setForm({ ...form, parentAccount: v })}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent account" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Currency</Label>
              <CurrencySelect 
                value={form.currency} 
                onChange={(v) => setForm({ ...form, currency: v })}
                className="w-full"
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening Balance</Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              value={form.openingBalance}
              onChange={(e) => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })}
              disabled={viewMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              disabled={viewMode}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3 text-slate-900">Contact Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Type</Label>
                <Select 
                  value={form.contactType || 'none'} 
                  onValueChange={(v) => setForm({ ...form, contactType: v === 'none' ? '' : v })}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={form.contactPerson || ''}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="e.g., John Doe"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g., +1234567890"
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g., contact@example.com"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                placeholder="Enter address"
                disabled={viewMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city || ''}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g., Mumbai"
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state || ''}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g., Maharashtra"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country || ''}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="e.g., India"
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={form.region || ''}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="e.g., Western India"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">PIN Code</Label>
                <Input
                  id="pincode"
                  value={form.pincode || ''}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="e.g., 400001"
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeOfSupply">Place of Supply</Label>
                <Input
                  id="placeOfSupply"
                  value={form.placeOfSupply || ''}
                  onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })}
                  placeholder="e.g., Maharashtra"
                  disabled={viewMode}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3 text-slate-900">Financial Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select 
                  value={form.paymentTerms || 'none'} 
                  onValueChange={(v) => setForm({ ...form, paymentTerms: v === 'none' ? '' : v })}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="net_7">Net 7</SelectItem>
                    <SelectItem value="net_15">Net 15</SelectItem>
                    <SelectItem value="net_30">Net 30</SelectItem>
                    <SelectItem value="net_45">Net 45</SelectItem>
                    <SelectItem value="net_60">Net 60</SelectItem>
                    <SelectItem value="net_90">Net 90</SelectItem>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="advance">Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  value={form.creditLimit || 0}
                  onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={form.taxId || ''}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  placeholder="e.g., 12-3456789"
                  disabled={viewMode}
                />
              </div>
              {form.type === 'liability' && (
                <div className="space-y-2">
                  <Label>MSME</Label>
                  <Select 
                    value={form.msme || 'none'} 
                    onValueChange={(v) => setForm({ ...form, msme: v === 'none' ? '' : v })}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select MSME" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Micro">Micro</SelectItem>
                      <SelectItem value="Small">Small</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="gstId">GST Number</Label>
                <Input
                  id="gstId"
                  value={form.gstId || ''}
                  onChange={(e) => setForm({ ...form, gstId: e.target.value })}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panId">PAN Number</Label>
                <Input
                  id="panId"
                  value={form.panId || ''}
                  onChange={(e) => setForm({ ...form, panId: e.target.value })}
                  placeholder="e.g., ABCDE1234F"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tanId">TAN Number</Label>
                <Input
                  id="tanId"
                  value={form.tanId || ''}
                  onChange={(e) => setForm({ ...form, tanId: e.target.value })}
                  placeholder="e.g., ABCD12345E"
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatId">VAT Number</Label>
                <Input
                  id="vatId"
                  value={form.vatId || ''}
                  onChange={(e) => setForm({ ...form, vatId: e.target.value })}
                  placeholder="e.g., GB123456789"
                  disabled={viewMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cinLlpin">CIN/LLPIN</Label>
                <Input
                  id="cinLlpin"
                  value={form.cinLlpin || ''}
                  onChange={(e) => setForm({ ...form, cinLlpin: e.target.value })}
                  placeholder="Enter CIN/LLPIN"
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coi">COI</Label>
                <Input
                  id="coi"
                  value={form.coi || ''}
                  onChange={(e) => setForm({ ...form, coi: e.target.value })}
                  placeholder="Enter COI"
                  disabled={viewMode}
                />
              </div>
            </div>

            {form.type === 'liability' && form.category === 'current_liability' && (() => {
              const parentAccount = accounts.find(a => a.id === form.parentAccount);
              const isTradePayable = parentAccount?.code === '10002' || parentAccount?.name?.includes('Trade Payable');
              return accountLevel === 'sub' && isTradePayable;
            })() && (
              <div className="space-y-2 mt-4">
                <Label>Vendor Category</Label>
                <Select 
                  value={form.supplierCategory || 'none'} 
                  onValueChange={(v) => setForm({ ...form, supplierCategory: v === 'none' ? '' : v })}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="garment_mfg">Garment Mfg</SelectItem>
                    <SelectItem value="testing_lab">Testing Lab</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="cha">CHA</SelectItem>
                    <SelectItem value="forwarder">Forwarder</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="sales_partner">Sales Partner</SelectItem>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="trims">Trims</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Label htmlFor="active">Active Account</Label>
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              disabled={viewMode}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (account ? 'Update' : 'Create')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}