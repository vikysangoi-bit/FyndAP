import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import CurrencySelect from "../shared/CurrencySelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const paymentTerms = [
  { value: "net_7", label: "Net 7 Days" },
  { value: "net_15", label: "Net 15 Days" },
  { value: "net_30", label: "Net 30 Days" },
  { value: "net_45", label: "Net 45 Days" },
  { value: "net_60", label: "Net 60 Days" },
  { value: "net_90", label: "Net 90 Days" },
  { value: "cod", label: "Cash on Delivery" },
  { value: "advance", label: "Advance Payment" },
];

const categories = [
  { value: "fabric", label: "Fabric" },
  { value: "trims", label: "Trims" },
  { value: "accessories", label: "Accessories" },
  { value: "packaging", label: "Packaging" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export default function SupplierForm({ open, onOpenChange, supplier, onSave, isLoading }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    payment_terms: 'net_30',
    currency: 'USD',
    credit_limit: 0,
    tax_id: '',
    bank_details: { bank_name: '', account_number: '', swift_code: '' },
    rating: 0,
    category: 'fabric',
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        ...supplier,
        bank_details: supplier.bank_details || { bank_name: '', account_number: '', swift_code: '' }
      });
    } else {
      setForm({
        code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        payment_terms: 'net_30',
        currency: 'USD',
        credit_limit: 0,
        tax_id: '',
        bank_details: { bank_name: '', account_number: '', swift_code: '' },
        rating: 0,
        category: 'fabric',
        is_active: true,
        notes: ''
      });
    }
  }, [supplier, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="bank">Bank Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Supplier Code *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="SUP-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ABC Textiles"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={form.contact_person || ''}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city || ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country || ''}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5 stars)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={form.rating || 0}
                  onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTerms.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <CurrencySelect 
                    value={form.currency} 
                    onChange={(v) => setForm({ ...form, currency: v })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                <Input
                  id="tax_id"
                  value={form.tax_id || ''}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={form.bank_details.bank_name || ''}
                  onChange={(e) => setForm({ 
                    ...form, 
                    bank_details: { ...form.bank_details, bank_name: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={form.bank_details.account_number || ''}
                  onChange={(e) => setForm({ 
                    ...form, 
                    bank_details: { ...form.bank_details, account_number: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="swift_code">SWIFT / BIC Code</Label>
                <Input
                  id="swift_code"
                  value={form.bank_details.swift_code || ''}
                  onChange={(e) => setForm({ 
                    ...form, 
                    bank_details: { ...form.bank_details, swift_code: e.target.value }
                  })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active Supplier</Label>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading ? 'Saving...' : (supplier ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}