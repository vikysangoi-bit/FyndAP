import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export default function DebitNoteForm({ open, onOpenChange, debitNote, vendorBills = [], accounts = [], onSave, isLoading, viewMode = false }) {
  // Filter accounts to get only Trade Payable suppliers (ID: 697babaff819e89ea60692b6)
  const tradePayableSuppliers = accounts.filter(acc => 
    acc.parentAccount === '697babaff819e89ea60692b6' && acc.active && !acc.is_deleted
  );
  const [form, setForm] = useState({
    accountCode: '',
    supplier: '',
    billNo: '',
    debitNoteNo: '',
    dnDate: '',
    dnCurrency: 'USD',
    dnNetValue: 0,
    dnTaxValue: 0,
    dnValue: 0,
    dnStatus: 'Adjustment',
    lineItems: [],
    vendorBillId: '',
    notes: ''
  });

  useEffect(() => {
    if (debitNote) {
      setForm({ ...debitNote, lineItems: debitNote.lineItems || [] });
    } else {
      setForm({
        accountCode: '',
        supplier: '',
        billNo: '',
        debitNoteNo: '',
        dnDate: '',
        dnCurrency: 'USD',
        dnNetValue: 0,
        dnTaxValue: 0,
        dnValue: 0,
        dnStatus: 'Adjustment',
        lineItems: [],
        vendorBillId: '',
        notes: ''
      });
    }
  }, [debitNote, open]);

  const handleBillChange = (billNo) => {
    setForm({ ...form, billNo });
    
    // Auto-fetch bill details
    const bill = vendorBills.find(b => b.billNo === billNo);
    if (bill) {
      setForm(prev => ({
        ...prev,
        billNo,
        vendorBillId: bill.id,
        accountCode: bill.accountCode || '',
        supplier: bill.supplier || '',
        dnCurrency: bill.billingCurrency || 'USD',
        dnStatus: 'Applied',
        lineItems: bill.lineItems?.map(item => ({
          itemCode: item.itemCode || '',
          articleNo: item.articleNo || '',
          styleID: item.styleID || '',
          itemCategory: item.itemCategory || '',
          description: item.description || '',
          composition: item.composition || '',
          size: item.size || '',
          color: item.color || '',
          hsnCode: item.hsnCode || '',
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          net_amount: item.net_amount || 0,
          tax_amount: item.tax_amount || 0,
          gross_amount: item.gross_amount || 0
        })) || []
      }));
    }
  };

  const handleNetValueChange = (value) => {
    const netValue = parseFloat(value) || 0;
    const taxValue = form.dnTaxValue || 0;
    setForm({ ...form, dnNetValue: netValue, dnValue: netValue + taxValue });
  };

  const handleTaxValueChange = (value) => {
    const taxValue = parseFloat(value) || 0;
    const netValue = form.dnNetValue || 0;
    setForm({ ...form, dnTaxValue: taxValue, dnValue: netValue + taxValue });
  };

  const handleRemoveItem = (index) => {
    const newItems = form.lineItems.filter((_, i) => i !== index);
    setForm({ ...form, lineItems: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!viewMode) {
      onSave(form);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewMode ? 'View Debit Note' : (debitNote ? 'Edit Debit Note' : 'New Debit Note')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bill No</Label>
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
              <Label htmlFor="debitNoteNo">Debit Note No *</Label>
              <Input
                id="debitNoteNo"
                value={form.debitNoteNo}
                onChange={(e) => setForm({ ...form, debitNoteNo: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dnDate">Date *</Label>
              <Input
                id="dnDate"
                type="date"
                value={form.dnDate}
                onChange={(e) => setForm({ ...form, dnDate: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select 
                value={form.supplier} 
                onValueChange={(v) => {
                  const selectedAccount = tradePayableSuppliers.find(acc => acc.name === v);
                  setForm({ 
                    ...form, 
                    supplier: v,
                    accountCode: selectedAccount?.code || ''
                  });
                }} 
                disabled={viewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {tradePayableSuppliers.map((acc) => (
                    <SelectItem key={acc.id} value={acc.name}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.dnCurrency} onValueChange={(v) => setForm({ ...form, dnCurrency: v })} disabled={viewMode}>
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

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dnNetValue">Net Value</Label>
              <Input
                id="dnNetValue"
                type="number"
                step="0.01"
                value={form.dnNetValue}
                onChange={(e) => handleNetValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dnTaxValue">Tax Value</Label>
              <Input
                id="dnTaxValue"
                type="number"
                step="0.01"
                value={form.dnTaxValue}
                onChange={(e) => handleTaxValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dnValue">Total Value</Label>
              <Input
                id="dnValue"
                type="number"
                step="0.01"
                value={form.dnValue}
                disabled
                className="bg-slate-50 font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.dnStatus} onValueChange={(v) => setForm({ ...form, dnStatus: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Line Items</Label>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Item Code</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Article No</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Style ID</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Category</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Description</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Composition</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Size</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Color</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">HSN</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Qty</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Rate</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Net Amount</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Tax</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Gross</th>
                      {!viewMode && <th className="p-2 text-left font-bold w-12"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems?.length > 0 ? (
                      form.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200">{item.itemCode || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.articleNo || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.styleID || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.itemCategory || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.description || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.composition || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.size || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.color || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.hsnCode || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{item.quantity || 0}</td>
                          <td className="p-2 border-r border-slate-200">{item.rate || 0}</td>
                          <td className="p-2 border-r border-slate-200">{item.net_amount || 0}</td>
                          <td className="p-2 border-r border-slate-200">{item.tax_amount || 0}</td>
                          <td className="p-2 border-r border-slate-200">{item.gross_amount || 0}</td>
                          {!viewMode && (
                            <td className="p-2">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={viewMode ? 14 : 15} className="p-6 text-center text-slate-400">
                          No line items. Select a bill to auto-populate items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {form.lineItems?.length > 0 && (
              <div className="text-right text-sm">
                <span className="font-semibold">Total Items: </span>
                <span>{form.lineItems.length}</span>
                <span className="ml-4 font-semibold">Total Qty: </span>
                <span>{form.lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (debitNote ? 'Update Debit Note' : 'Create Debit Note')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}