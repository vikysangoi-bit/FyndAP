import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const transactionTypes = [
  { value: "receipt", label: "Receipt (In)" },
  { value: "issue", label: "Issue (Out)" },
  { value: "adjustment", label: "Adjustment" },
  { value: "transfer", label: "Transfer" },
  { value: "return", label: "Return" },
];

export default function TransactionForm({ open, onOpenChange, transaction, onSave, isLoading }) {
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'receipt',
    po_number: '',
    po_id: '',
    items: [],
    from_location: '',
    to_location: ''
  });

  const [selectedPO, setSelectedPO] = useState(null);

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.filter({ status: 'approved' })
  });

  useEffect(() => {
    if (transaction) {
      setForm(transaction);
      const po = purchaseOrders.find(p => p.id === transaction.po_id);
      setSelectedPO(po);
    } else {
      setForm({
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'receipt',
        po_number: '',
        po_id: '',
        items: [],
        from_location: '',
        to_location: ''
      });
      setSelectedPO(null);
    }
  }, [transaction, open, purchaseOrders]);

  const handlePOChange = (poId) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setSelectedPO(po);
      setForm({
        ...form,
        po_id: poId,
        po_number: po.po_number,
        items: []
      });
    }
  };

  const handleSelectAll = (checked) => {
    if (checked && selectedPO?.items) {
      const allItems = selectedPO.items.map(poItem => ({
        item_id: poItem.itemCode,
        item_sku: poItem.itemCode,
        styleID: poItem.styleID || '',
        name: poItem.description || '',
        color: poItem.color || '',
        size: poItem.size || '',
        quantity: poItem.quantity || 0
      }));
      setForm({ ...form, items: allItems });
    } else {
      setForm({ ...form, items: [] });
    }
  };

  const handleItemToggle = (poItem) => {
    const exists = form.items.find(i => i.item_id === poItem.itemCode);
    if (exists) {
      setForm({
        ...form,
        items: form.items.filter(i => i.item_id !== poItem.itemCode)
      });
    } else {
      setForm({
        ...form,
        items: [...form.items, {
          item_id: poItem.itemCode,
          item_sku: poItem.itemCode,
          styleID: poItem.styleID || '',
          name: poItem.description || '',
          color: poItem.color || '',
          size: poItem.size || '',
          quantity: poItem.quantity || 0
        }]
      });
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    setForm({
      ...form,
      items: form.items.map(i => 
        i.item_id === itemId ? { ...i, quantity: parseFloat(quantity) || 0 } : i
      )
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.po_number || form.items.length === 0) {
      alert('Please select a PO and at least one item');
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit Transaction' : 'New Inventory Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>PO Number *</Label>
            <Select value={form.po_id} onValueChange={handlePOChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select purchase order" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.po_number} - {po.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPO && selectedPO.items?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Items *</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.items.length === selectedPO.items.length && form.items.length > 0}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer">
                    Select All
                  </label>
                </div>
              </div>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                {selectedPO.items.map((poItem, idx) => {
                  const isSelected = form.items.find(i => i.item_id === poItem.itemCode);
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Checkbox
                        checked={!!isSelected}
                        onCheckedChange={() => handleItemToggle(poItem)}
                      />
                      <div className="flex-1 grid grid-cols-5 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Style ID:</span>
                          <p className="font-medium">{poItem.styleID || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Name:</span>
                          <p className="font-medium">{poItem.description || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Color:</span>
                          <p className="font-medium">{poItem.color || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Size:</span>
                          <p className="font-medium">{poItem.size || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Qty:</span>
                          {isSelected ? (
                            <Input
                              type="number"
                              value={isSelected.quantity}
                              onChange={(e) => handleQuantityChange(poItem.itemCode, e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <p className="font-medium">{poItem.quantity || 0}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {form.type === 'transfer' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Location</Label>
                <Input
                  value={form.from_location || ''}
                  onChange={(e) => setForm({ ...form, from_location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>To Location</Label>
                <Input
                  value={form.to_location || ''}
                  onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
              {isLoading ? 'Saving...' : (transaction ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}