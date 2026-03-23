import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaymentForm({ open, onOpenChange, payment, vendorBills = [], onSave, isLoading, viewMode = false }) {
  const [form, setForm] = useState({
    accountCode: '',
    supplier: '',
    billNo: '',
    paymentDate: '',
    paymentCurrency: 'USD',
    paymentValue: 0,
    tdsHoldValue: 0,
    gstHoldValue: 0,
    otherHoldValue: 0,
    utr: '',
    vendorBillId: '',
    notes: ''
  });

  useEffect(() => {
    if (payment) {
      setForm(payment);
    } else {
      setForm({
        accountCode: '',
        supplier: '',
        billNo: '',
        paymentDate: '',
        paymentCurrency: 'USD',
        paymentValue: 0,
        tdsHoldValue: 0,
        gstHoldValue: 0,
        otherHoldValue: 0,
        utr: '',
        vendorBillId: '',
        notes: ''
      });
    }
  }, [payment, open]);

  const handleBillChange = (billNo) => {
    setForm({ ...form, billNo });
    
    const bill = vendorBills.find(b => b.billNo === billNo);
    if (bill) {
      setForm(prev => ({
        ...prev,
        billNo,
        vendorBillId: bill.id,
        accountCode: bill.accountCode || '',
        supplier: bill.supplier || '',
        paymentCurrency: bill.billingCurrency || 'USD'
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewMode ? 'View Payment' : (payment ? 'Edit Payment' : 'New Payment')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bill No *</Label>
              <Select value={form.billNo} onValueChange={handleBillChange} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Bill" />
                </SelectTrigger>
                <SelectContent>
                  {vendorBills.filter(bill => !bill.is_deleted).map((bill) => (
                    <SelectItem key={bill.id} value={bill.billNo}>{bill.billNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Input
                id="supplier"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.paymentCurrency} onValueChange={(v) => setForm({ ...form, paymentCurrency: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentValue">Payment Value *</Label>
              <Input
                id="paymentValue"
                type="number"
                step="0.01"
                value={form.paymentValue}
                onChange={(e) => setForm({ ...form, paymentValue: parseFloat(e.target.value) || 0 })}
                required
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utr">UTR</Label>
              <Input
                id="utr"
                value={form.utr}
                onChange={(e) => setForm({ ...form, utr: e.target.value })}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (payment ? 'Update Payment' : 'Create Payment')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}