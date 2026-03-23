import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InvoiceForm({ open, onOpenChange, invoice, accounts = [], salesOrders = [], onSave, isLoading, viewMode = false }) {
  const [form, setForm] = useState({
    customerCode: '',
    customerName: '',
    serviceName: 'DaaS',
    orderFormNo: '',
    invoiceNo: '',
    invoiceDate: '',
    invoiceCurrency: 'USD',
    invoiceNetValue: 0,
    invoiceTaxValue: 0,
    invoiceValue: 0,
    invoiceSharedOn: '',
    paymentTerms: 'net_30',
    paymentDueDate: '',
    invoiceStatus: 'Open',
    invoiceType: 'Tax',
    salesOrderId: '',
    customerBrand: '',
    customerRegion: '',
    salesPersonName: ''
  });

  useEffect(() => {
    if (invoice) {
      setForm(invoice);
    } else {
      setForm({
        customerCode: '',
        customerName: '',
        serviceName: 'DaaS',
        orderFormNo: '',
        invoiceNo: '',
        invoiceDate: '',
        invoiceCurrency: 'USD',
        invoiceNetValue: 0,
        invoiceTaxValue: 0,
        invoiceValue: 0,
        invoiceSharedOn: '',
        paymentTerms: 'net_30',
        paymentDueDate: '',
        invoiceStatus: 'Open',
        invoiceType: 'Tax',
        salesOrderId: '',
        customerBrand: '',
        customerRegion: '',
        salesPersonName: ''
      });
    }
  }, [invoice, open]);

  const handleCustomerCodeChange = (code) => {
    setForm({ ...form, customerCode: code });
    
    // Auto-fetch customer details from Account
    const customer = accounts.find(a => a.code === code);
    if (customer) {
      setForm(prev => ({
        ...prev,
        customerCode: code,
        customerName: customer.name || '',
        customerRegion: customer.region || '',
        invoiceCurrency: customer.currency || 'USD',
        paymentTerms: customer.paymentTerms || 'net_30'
      }));
    }
  };

  const handleOrderFormNoChange = (orderFormNo) => {
    setForm({ ...form, orderFormNo });
    
    // Auto-fetch sales order details
    const salesOrder = salesOrders.find(so => so.orderFormNo === orderFormNo);
    if (salesOrder) {
      setForm(prev => ({
        ...prev,
        orderFormNo,
        salesOrderId: salesOrder.id,
        customerCode: salesOrder.customerCode || prev.customerCode,
        customerName: salesOrder.customerName || prev.customerName,
        customerBrand: salesOrder.customerBrand || '',
        serviceName: salesOrder.serviceName || prev.serviceName,
        salesPersonName: salesOrder.salesPersonName || '',
        invoiceCurrency: salesOrder.currency || prev.invoiceCurrency,
        paymentTerms: salesOrder.paymentTerm || prev.paymentTerms
      }));
    }
  };

  const handleNetValueChange = (value) => {
    const netValue = parseFloat(value) || 0;
    const taxValue = form.invoiceTaxValue || 0;
    setForm({ ...form, invoiceNetValue: netValue, invoiceValue: netValue + taxValue });
  };

  const handleTaxValueChange = (value) => {
    const taxValue = parseFloat(value) || 0;
    const netValue = form.invoiceNetValue || 0;
    setForm({ ...form, invoiceTaxValue: taxValue, invoiceValue: netValue + taxValue });
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
          <DialogTitle>{viewMode ? 'View Invoice' : (invoice ? 'Edit Invoice' : 'New Invoice')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Invoice No *</Label>
              <Input
                id="invoiceNo"
                value={form.invoiceNo}
                onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={form.invoiceDate}
                onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Form No</Label>
              <Select value={form.orderFormNo} onValueChange={handleOrderFormNoChange} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales order" />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders.filter(so => !so.is_deleted).map((so) => (
                    <SelectItem key={so.id} value={so.orderFormNo}>{so.orderFormNo}</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Currency</Label>
              <Select value={form.invoiceCurrency} onValueChange={(v) => setForm({ ...form, invoiceCurrency: v })} disabled={viewMode}>
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
              <Label htmlFor="invoiceSharedOn">Invoice Shared On</Label>
              <Input
                id="invoiceSharedOn"
                type="date"
                value={form.invoiceSharedOn}
                onChange={(e) => setForm({ ...form, invoiceSharedOn: e.target.value })}
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNetValue">Net Value</Label>
              <Input
                id="invoiceNetValue"
                type="number"
                step="0.01"
                value={form.invoiceNetValue}
                onChange={(e) => handleNetValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceTaxValue">Tax Value</Label>
              <Input
                id="invoiceTaxValue"
                type="number"
                step="0.01"
                value={form.invoiceTaxValue}
                onChange={(e) => handleTaxValueChange(e.target.value)}
                disabled={viewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceValue">Total Value</Label>
              <Input
                id="invoiceValue"
                type="number"
                step="0.01"
                value={form.invoiceValue}
                disabled
                className="bg-slate-50 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select value={form.paymentTerms} onValueChange={(v) => setForm({ ...form, paymentTerms: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_7">Net 7</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="net_60">Net 60</SelectItem>
                  <SelectItem value="net_90">Net 90</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Type</Label>
              <Select value={form.invoiceType} onValueChange={(v) => setForm({ ...form, invoiceType: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tax">Tax</SelectItem>
                  <SelectItem value="Proforma">Proforma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invoice Status</Label>
              <Select value={form.invoiceStatus} onValueChange={(v) => setForm({ ...form, invoiceStatus: v })} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}