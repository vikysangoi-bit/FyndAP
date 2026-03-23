import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReceiptForm({ open, onOpenChange, receipt, invoices = [], accounts = [], onSave, isLoading, viewMode = false }) {
  const [form, setForm] = useState({
    customerCode: '',
    customerName: '',
    invoiceNo: '',
    receiptDate: '',
    receiptCurrency: 'USD',
    receiptValue: 0,
    tdsHoldValue: 0,
    gstHoldValue: 0,
    otherHoldValue: 0,
    utr: '',
    receiverBank: '',
    invoiceId: ''
  });

  useEffect(() => {
    if (receipt) {
      setForm(receipt);
    } else {
      setForm({
        customerCode: '',
        customerName: '',
        invoiceNo: '',
        receiptDate: '',
        receiptCurrency: 'USD',
        receiptValue: 0,
        tdsHoldValue: 0,
        gstHoldValue: 0,
        otherHoldValue: 0,
        utr: '',
        receiverBank: '',
        invoiceId: ''
      });
    }
  }, [receipt, open]);

  const handleInvoiceNoChange = (invoiceNo) => {
    setForm({ ...form, invoiceNo });
    
    // Auto-fetch invoice details
    const invoice = invoices.find(inv => inv.invoiceNo === invoiceNo);
    if (invoice) {
      setForm(prev => ({
        ...prev,
        invoiceNo,
        invoiceId: invoice.id,
        customerCode: invoice.customerCode || '',
        customerName: invoice.customerName || '',
        receiptCurrency: invoice.invoiceCurrency || 'USD'
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!viewMode) {
      onSave(form);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewMode ? 'View Receipt' : (receipt ? 'Edit Receipt' : 'New Receipt')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice No *</Label>
              <Select value={form.invoiceNo} onValueChange={handleInvoiceNoChange} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.filter(inv => !inv.is_deleted).map((inv) => (
                    <SelectItem key={inv.id} value={inv.invoiceNo}>
                      {inv.invoiceNo} - {inv.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptDate">Receipt Date *</Label>
              <Input
                id="receiptDate"
                type="date"
                value={form.receiptDate}
                onChange={(e) => setForm({ ...form, receiptDate: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Client Name</Label>
            <Input
              id="customerName"
              value={form.customerName}
              disabled
              className="bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Receipt Currency</Label>
              <Select value={form.receiptCurrency} onValueChange={(v) => setForm({ ...form, receiptCurrency: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptValue">Receipt Value *</Label>
              <Input
                id="receiptValue"
                type="number"
                step="0.01"
                value={form.receiptValue}
                onChange={(e) => setForm({ ...form, receiptValue: parseFloat(e.target.value) || 0 })}
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tdsHoldValue">TDS Hold Value</Label>
              <Input
                id="tdsHoldValue"
                type="number"
                step="0.01"
                value={form.tdsHoldValue}
                onChange={(e) => setForm({ ...form, tdsHoldValue: parseFloat(e.target.value) || 0 })}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstHoldValue">GST Hold Value</Label>
              <Input
                id="gstHoldValue"
                type="number"
                step="0.01"
                value={form.gstHoldValue}
                onChange={(e) => setForm({ ...form, gstHoldValue: parseFloat(e.target.value) || 0 })}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherHoldValue">Other Hold Value</Label>
              <Input
                id="otherHoldValue"
                type="number"
                step="0.01"
                value={form.otherHoldValue}
                onChange={(e) => setForm({ ...form, otherHoldValue: parseFloat(e.target.value) || 0 })}
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="utr">UTR / Transaction Reference</Label>
              <Input
                id="utr"
                value={form.utr}
                onChange={(e) => setForm({ ...form, utr: e.target.value })}
                placeholder="e.g., UTR123456789"
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiverBank">Receiver Bank</Label>
              <Input
                id="receiverBank"
                value={form.receiverBank}
                onChange={(e) => setForm({ ...form, receiverBank: e.target.value })}
                placeholder="e.g., HDFC Bank"
                disabled={viewMode}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (receipt ? 'Update Receipt' : 'Create Receipt')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}