import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreditNoteForm({ open, onOpenChange, creditNote, invoices = [], accounts = [], onSave, isLoading, viewMode = false }) {
  const [form, setForm] = useState({
    customerCode: '',
    customerName: '',
    invoiceNo: '',
    creditNoteNo: '',
    cnDate: '',
    cnCurrency: 'USD',
    cnNetValue: 0,
    cnTaxValue: 0,
    cnValue: 0,
    cnStatus: 'Adjustment',
    invoiceId: ''
  });

  useEffect(() => {
    if (creditNote) {
      setForm(creditNote);
    } else {
      setForm({
        customerCode: '',
        customerName: '',
        invoiceNo: '',
        creditNoteNo: '',
        cnDate: '',
        cnCurrency: 'USD',
        cnNetValue: 0,
        cnTaxValue: 0,
        cnValue: 0,
        cnStatus: 'Adjustment',
        invoiceId: ''
      });
    }
  }, [creditNote, open]);

  const handleInvoiceNoChange = (invoiceNo) => {
    // If invoice is selected, set status to Applied, otherwise Adjustment
    const newStatus = invoiceNo ? 'Applied' : 'Adjustment';
    setForm({ ...form, invoiceNo, cnStatus: newStatus });
    
    if (invoiceNo) {
      // Auto-fetch invoice details
      const invoice = invoices.find(inv => inv.invoiceNo === invoiceNo);
      if (invoice) {
        setForm(prev => ({
          ...prev,
          invoiceNo,
          invoiceId: invoice.id,
          customerCode: invoice.customerCode || '',
          customerName: invoice.customerName || '',
          cnCurrency: invoice.invoiceCurrency || 'USD',
          cnStatus: 'Applied'
        }));
      }
    }
  };

  const handleCustomerCodeChange = (code) => {
    setForm({ ...form, customerCode: code });
    
    // Auto-fetch customer details from Account
    const customer = accounts.find(a => a.code === code);
    if (customer) {
      setForm(prev => ({
        ...prev,
        customerCode: code,
        customerName: customer.name || '',
        cnCurrency: customer.currency || 'USD'
      }));
    }
  };

  const handleNetValueChange = (value) => {
    const netValue = parseFloat(value) || 0;
    const taxValue = form.cnTaxValue || 0;
    setForm({ ...form, cnNetValue: netValue, cnValue: netValue + taxValue });
  };

  const handleTaxValueChange = (value) => {
    const taxValue = parseFloat(value) || 0;
    const netValue = form.cnNetValue || 0;
    setForm({ ...form, cnTaxValue: taxValue, cnValue: netValue + taxValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!viewMode) {
      onSave(form);
    }
  };

  // Filter accounts where parent account code is "10001" (Trade Receivables)
  const customerAccounts = accounts.filter(a => {
    return a.code === '10001' || (a.parentAccount && accounts.find(p => p.id === a.parentAccount)?.code === '10001');
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewMode ? 'View Credit Note' : (creditNote ? 'Edit Credit Note' : 'New Credit Note')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditNoteNo">Credit Note No *</Label>
              <Input
                id="creditNoteNo"
                value={form.creditNoteNo}
                onChange={(e) => setForm({ ...form, creditNoteNo: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnDate">Date *</Label>
              <Input
                id="cnDate"
                type="date"
                value={form.cnDate}
                onChange={(e) => setForm({ ...form, cnDate: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Select value={form.customerCode} onValueChange={handleCustomerCodeChange} disabled={viewMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {customerAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.code}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Invoice No (Optional)</Label>
            <Select value={form.invoiceNo || 'none'} onValueChange={(v) => handleInvoiceNoChange(v === 'none' ? '' : v)} disabled={viewMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice or leave empty for adjustment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Invoice (Adjustment)</SelectItem>
                {invoices.filter(inv => !inv.is_deleted).map((inv) => (
                  <SelectItem key={inv.id} value={inv.invoiceNo}>
                    {inv.invoiceNo} - {inv.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Select an invoice to apply credit, or leave empty for adjustment</p>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={form.cnCurrency} onValueChange={(v) => setForm({ ...form, cnCurrency: v })} disabled={viewMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnNetValue">Net Value</Label>
              <Input
                id="cnNetValue"
                type="number"
                step="0.01"
                value={form.cnNetValue}
                onChange={(e) => handleNetValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnTaxValue">Tax Value</Label>
              <Input
                id="cnTaxValue"
                type="number"
                step="0.01"
                value={form.cnTaxValue}
                onChange={(e) => handleTaxValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnValue">Total Value</Label>
              <Input
                id="cnValue"
                type="number"
                step="0.01"
                value={form.cnValue}
                disabled
                className="bg-slate-50 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Input
              value={form.cnStatus}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">Status is auto-set: "Applied" if invoice is selected, "Adjustment" otherwise</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (creditNote ? 'Update Credit Note' : 'Create Credit Note')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}