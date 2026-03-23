import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VendorBillForm({ open, onOpenChange, vendorBill, accounts = [], purchaseOrders = [], onSave, isLoading, viewMode = false }) {
  // Filter accounts to get only Trade Payable suppliers (ID: 697babaff819e89ea60692b6)
  const tradePayableSuppliers = accounts.filter(acc => 
    acc.parentAccount === '697babaff819e89ea60692b6' && acc.active && !acc.is_deleted
  );
  const [inventoryTransactions, setInventoryTransactions] = React.useState([]);
  const [form, setForm] = useState({
    accountCode: '',
    supplier: '',
    serviceName: 'DaaS',
    poNo: '',
    grn_number: '',
    billNo: '',
    billDate: '',
    billingCurrency: 'USD',
    billNetValue: 0,
    billTaxValue: 0,
    billValue: 0,
    billSharedOn: '',
    paymentTerms: 'net_30',
    paymentDueDate: '',
    currentStatus: 'Open',
    lineItems: [],
    po_id: '',
    supplier_id: '',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      // Fetch inventory transactions for Txn no dropdown - only Unapplied or Partial Applied
      base44.entities.InventoryTransaction.filter({ type: 'receipt' }).then(txns => {
        setInventoryTransactions(txns.filter(t => 
          !t.is_deleted && 
          (t.status === 'completed' || t.status === 'approved') && 
          (t.application_status === 'Unapplied' || t.application_status === 'Partial Applied')
        ));
      });
    }

    if (vendorBill) {
      setForm({ ...vendorBill, lineItems: vendorBill.lineItems || [], grn_number: vendorBill.grn_number || '' });
    } else {
      setForm({
        accountCode: '',
        supplier: '',
        serviceName: 'DaaS',
        poNo: '',
        grn_number: '',
        billNo: '',
        billDate: '',
        billingCurrency: 'USD',
        billNetValue: 0,
        billTaxValue: 0,
        billValue: 0,
        billSharedOn: '',
        paymentTerms: 'net_30',
        paymentDueDate: '',
        currentStatus: 'Open',
        lineItems: [],
        po_id: '',
        supplier_id: '',
        notes: ''
      });
    }
  }, [vendorBill, open]);

  const handlePOChange = (poNo) => {
    setForm({ ...form, poNo });
    
    // Only populate from PO if grn_number is not set
    if (!form.grn_number) {
      const po = purchaseOrders.find(p => p.po_number === poNo);
      if (po) {
        setForm(prev => ({
          ...prev,
          poNo,
          po_id: po.id,
          supplier: po.supplier_name || '',
          supplier_id: po.supplier_id || '',
          billingCurrency: po.currency || 'USD',
          paymentTerms: po.payment_terms || 'net_30',
          lineItems: po.items?.map(item => ({
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
            rate: item.rate_per_unit || 0,
            net_amount: item.net_before_gst || 0,
            tax_amount: (item.gross_value || 0) - (item.net_before_gst || 0),
            gross_amount: item.gross_value || 0
          })) || []
        }));
      }
    }
  };

  const handleTxnChange = (txnNumber) => {
    setForm({ ...form, grn_number: txnNumber });
    
    // Auto-fetch transaction details if txn is selected
    if (txnNumber) {
      const txn = inventoryTransactions.find(t => t.transaction_number === txnNumber);
      if (txn) {
        setForm(prev => ({
          ...prev,
          grn_number: txnNumber,
          poNo: txn.po_number || prev.poNo,
          po_id: txn.po_id || prev.po_id,
          lineItems: txn.items?.map(item => ({
            itemCode: item.item_sku || '',
            articleNo: '',
            styleID: item.styleID || '',
            itemCategory: '',
            description: item.name || '',
            composition: '',
            size: item.size || '',
            color: item.color || '',
            hsnCode: '',
            quantity: item.quantity || 0,
            rate: 0,
            net_amount: 0,
            tax_amount: 0,
            gross_amount: 0
          })) || []
        }));
      }
    }
  };

  const handleNetValueChange = (value) => {
    const netValue = parseFloat(value) || 0;
    const taxValue = form.billTaxValue || 0;
    setForm({ ...form, billNetValue: netValue, billValue: netValue + taxValue });
  };

  const handleTaxValueChange = (value) => {
    const taxValue = parseFloat(value) || 0;
    const netValue = form.billNetValue || 0;
    setForm({ ...form, billTaxValue: taxValue, billValue: netValue + taxValue });
  };

  // Auto-calculate bill values from line items
  useEffect(() => {
    if (form.lineItems?.length > 0) {
      const totalNet = form.lineItems.reduce((sum, item) => sum + (parseFloat(item.net_amount) || 0), 0);
      const totalTax = form.lineItems.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0);
      const totalGross = form.lineItems.reduce((sum, item) => sum + (parseFloat(item.gross_amount) || 0), 0);
      
      setForm(prev => ({
        ...prev,
        billNetValue: totalNet,
        billTaxValue: totalTax,
        billValue: totalGross
      }));
    }
  }, [form.lineItems]);

  // Auto-calculate payment due date based on payment terms and bill date
  useEffect(() => {
    if (form.billDate && form.paymentTerms) {
      const billDate = new Date(form.billDate);
      const daysToAdd = parseInt(form.paymentTerms.replace('net_', '')) || 30;
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      
      const formattedDueDate = dueDate.toISOString().split('T')[0];
      setForm(prev => ({ ...prev, paymentDueDate: formattedDueDate }));
    }
  }, [form.billDate, form.paymentTerms]);

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
          <DialogTitle>{viewMode ? 'View Vendor Bill' : (vendorBill ? 'Edit Vendor Bill' : 'New Vendor Bill')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>PO No</Label>
              <Select value={form.poNo} onValueChange={handlePOChange} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.filter(po => !po.is_deleted && po.status === 'approved').map((po) => (
                    <SelectItem key={po.id} value={po.po_number}>{po.po_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Txn No (GRN)</Label>
              <Select value={form.grn_number} onValueChange={handleTxnChange} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Transaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {inventoryTransactions.map((txn) => (
                    <SelectItem key={txn.id} value={txn.transaction_number}>
                      {txn.transaction_number} ({txn.application_status || 'Unapplied'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billNo">Bill No *</Label>
              <Input
                id="billNo"
                value={form.billNo}
                onChange={(e) => setForm({ ...form, billNo: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billDate">Bill Date *</Label>
              <Input
                id="billDate"
                type="date"
                value={form.billDate}
                onChange={(e) => setForm({ ...form, billDate: e.target.value })}
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
              <Label>Service Name</Label>
              <Select value={form.serviceName} onValueChange={(v) => setForm({ ...form, serviceName: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DaaS">DaaS</SelectItem>
                  <SelectItem value="GaaS">GaaS</SelectItem>
                  <SelectItem value="AI Photoshoot">AI Photoshoot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Billing Currency</Label>
              <Select value={form.billingCurrency} onValueChange={(v) => setForm({ ...form, billingCurrency: v })} disabled={viewMode}>
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
              <Label htmlFor="billSharedOn">Bill Shared On</Label>
              <Input
                id="billSharedOn"
                type="date"
                value={form.billSharedOn}
                onChange={(e) => setForm({ ...form, billSharedOn: e.target.value })}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select value={form.paymentTerms} onValueChange={(v) => setForm({ ...form, paymentTerms: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="net_45">Net 45</SelectItem>
                  <SelectItem value="net_60">Net 60</SelectItem>
                  <SelectItem value="net_90">Net 90</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billNetValue">Bill Net Value</Label>
              <Input
                id="billNetValue"
                type="number"
                step="0.01"
                value={form.billNetValue}
                onChange={(e) => handleNetValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billTaxValue">Bill Tax Value</Label>
              <Input
                id="billTaxValue"
                type="number"
                step="0.01"
                value={form.billTaxValue}
                onChange={(e) => handleTaxValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billValue">Bill Value</Label>
              <Input
                id="billValue"
                type="number"
                step="0.01"
                value={form.billValue}
                disabled
                className="bg-slate-50 font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDueDate">Payment Due Date</Label>
              <Input
                id="paymentDueDate"
                type="date"
                value={form.paymentDueDate}
                onChange={(e) => setForm({ ...form, paymentDueDate: e.target.value })}
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Current Status</Label>
            <Select value={form.currentStatus} onValueChange={(v) => setForm({ ...form, currentStatus: v })} disabled={viewMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partially paid">Partially paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Line Items</Label>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-w-full">
                <table className="text-sm" style={{ minWidth: '2000px' }}>
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '120px' }}>Item Code</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '120px' }}>Article No</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '100px' }}>Style ID</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '120px' }}>Category</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '180px' }}>Description</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '150px' }}>Composition</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '80px' }}>Size</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '100px' }}>Color</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '100px' }}>HSN</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '80px' }}>Qty</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '100px' }}>Rate</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '120px' }}>Net Amount</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '100px' }}>Tax</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300" style={{ minWidth: '100px' }}>Gross</th>
                      {!viewMode && <th className="p-2 text-left font-bold w-12"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems?.length > 0 ? (
                      form.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.itemCode || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].itemCode = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.articleNo || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].articleNo = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.styleID || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].styleID = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.itemCategory || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].itemCategory = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.description || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].description = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.composition || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].composition = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.size || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].size = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.color || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].color = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              value={item.hsnCode || ''} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].hsnCode = e.target.value;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              type="number"
                              value={item.quantity || 0} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              type="number"
                              step="0.01"
                              value={item.rate || 0} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].rate = parseFloat(e.target.value) || 0;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              type="number"
                              step="0.01"
                              value={item.net_amount || 0} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].net_amount = parseFloat(e.target.value) || 0;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              type="number"
                              step="0.01"
                              value={item.tax_amount || 0} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].tax_amount = parseFloat(e.target.value) || 0;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <Input 
                              type="number"
                              step="0.01"
                              value={item.gross_amount || 0} 
                              onChange={(e) => {
                                const newItems = [...form.lineItems];
                                newItems[idx].gross_amount = parseFloat(e.target.value) || 0;
                                setForm({ ...form, lineItems: newItems });
                              }}
                              disabled={viewMode}
                              className="h-8 text-xs w-full"
                            />
                          </td>
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
                          No line items. Select a PO to auto-populate items.
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
                {isLoading ? 'Saving...' : (vendorBill ? 'Update Vendor Bill' : 'Create Vendor Bill')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}