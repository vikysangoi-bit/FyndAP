import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GoodsReceiptForm({ open, onOpenChange, po, onSave, isLoading }) {
  const [form, setForm] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    po_id: '',
    po_number: '',
    supplier_id: '',
    supplier_name: '',
    items: [],
    invoice_number: '',
    invoice_date: '',
    notes: '',
    quality_check_status: 'pending'
  });

  useEffect(() => {
    if (po && open) {
      setForm({
        receipt_date: new Date().toISOString().split('T')[0],
        po_id: po.id,
        po_number: po.po_number,
        supplier_id: po.supplier_id,
        supplier_name: po.supplier_name,
        currency: po.currency,
        items: po.items?.map(item => ({
          item_id: item.item_id,
          item_sku: item.item_sku,
          item_name: item.item_name,
          ordered_quantity: item.quantity,
          received_quantity: item.quantity - (item.received_quantity || 0),
          unit: item.unit,
          unit_price: item.unit_price,
          total: 0,
          warehouse_location: '',
          batch_number: '',
          notes: ''
        })) || [],
        invoice_number: '',
        invoice_date: '',
        notes: '',
        quality_check_status: 'pending'
      });
    }
  }, [po, open]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'received_quantity') {
      newItems[index].total = (parseFloat(value) || 0) * (newItems[index].unit_price || 0);
    }

    const total_amount = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    setForm({ ...form, items: newItems, total_amount });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const totalReceiving = form.items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Receive Goods - PO {po?.po_number}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm text-slate-500">Supplier</p>
              <p className="font-medium">{form.supplier_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">PO Number</p>
              <p className="font-medium">{form.po_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Receipt Date *</Label>
              <Input
                type="date"
                value={form.receipt_date}
                onChange={(e) => setForm({ ...form, receipt_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier Invoice #</Label>
              <Input
                value={form.invoice_number || ''}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                placeholder="INV-12345"
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={form.invoice_date || ''}
                onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quality Check</Label>
              <Select 
                value={form.quality_check_status} 
                onValueChange={(v) => setForm({ ...form, quality_check_status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Enter the actual quantities received. Inventory and accounts payable will be updated automatically.
            </AlertDescription>
          </Alert>

          {/* Items Section */}
          <Card className="p-4 border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-4">Items to Receive</h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-2">
                <div className="col-span-3">Item</div>
                <div className="col-span-1 text-right">Ordered</div>
                <div className="col-span-2">Receiving</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">Batch #</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <div>
                      <p className="font-medium text-sm">{item.item_name}</p>
                      <p className="text-xs text-slate-500">{item.item_sku}</p>
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-sm">
                    {item.ordered_quantity} {item.unit}
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-9"
                      type="number"
                      step="0.01"
                      value={item.received_quantity || ''}
                      onChange={(e) => handleItemChange(index, 'received_quantity', parseFloat(e.target.value) || 0)}
                      max={item.ordered_quantity}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-9"
                      value={item.warehouse_location || ''}
                      onChange={(e) => handleItemChange(index, 'warehouse_location', e.target.value)}
                      placeholder="A-1-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-9"
                      value={item.batch_number || ''}
                      onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                      placeholder="Batch"
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium pr-2">
                    {form.currency} {(item.total || 0).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-12 gap-2 pt-4 border-t border-slate-200">
                <div className="col-span-10 text-right font-bold text-slate-900">Total Receiving:</div>
                <div className="col-span-2 text-right font-bold text-lg text-slate-900">
                  {form.currency} {totalReceiving.toFixed(2)}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label>Receipt Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about the received goods..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? 'Processing...' : 'Receive Goods'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}