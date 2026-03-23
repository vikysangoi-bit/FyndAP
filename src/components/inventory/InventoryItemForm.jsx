import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Info } from "lucide-react";

const categories = [
  { value: "fabric", label: "Fabric" },
  { value: "trims", label: "Trims" },
  { value: "accessories", label: "Accessories" },
  { value: "packaging", label: "Packaging" },
  { value: "garments", label: "Garments" },
  { value: "samples", label: "Samples" },
  { value: "electronics", label: "Electronics" },
  { value: "stationery", label: "Stationery" },
  { value: "other", label: "Other" },
];

const itemTypes = [
  { value: "raw_material", label: "Raw Material" },
  { value: "finished_goods", label: "Finished Goods" },
  { value: "semi_finished", label: "Semi-Finished" },
  { value: "consumable", label: "Consumable" },
  { value: "trading", label: "Trading Goods" },
  { value: "service", label: "Service" },
];

const units = [
  { value: "meters", label: "Meters (m)" },
  { value: "yards", label: "Yards (yd)" },
  { value: "pieces", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "grams", label: "Grams (g)" },
  { value: "litres", label: "Litres (l)" },
  { value: "rolls", label: "Rolls" },
  { value: "boxes", label: "Boxes" },
  { value: "sets", label: "Sets" },
  { value: "pairs", label: "Pairs" },
  { value: "dozen", label: "Dozen" },
  { value: "nos", label: "Numbers (nos)" },
];

const gstRates = [
  { value: 0, label: "0% (Exempt)" },
  { value: 5, label: "5%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18%" },
  { value: 28, label: "28%" },
];

const valuationMethods = [
  { value: "weighted_average", label: "Weighted Average (AVCO)" },
  { value: "fifo", label: "First In First Out (FIFO)" },
  { value: "standard_cost", label: "Standard Cost" },
];

const EMPTY_FORM = {
  sku: '',
  styleID: '',
  articleNo: '',
  ean: '',
  hsnCode: '',
  name: '',
  category: 'fabric',
  sub_category: '',
  item_type: 'raw_material',
  unit: 'meters',
  is_active: true,
  // Pricing & Tax
  purchase_price: 0,
  mrp: 0,
  tax_rate: 5,
  valuation_method: 'weighted_average',
  average_cost: 0,
  // Stock & Procurement
  quantity_on_hand: 0,
  reorder_level: 0,
  minimum_order_qty: 1,
  lead_time_days: 7,
  warehouse_location: '',
  supplier: '',
  // Attributes
  color: '',
  size: '',
  gsm: '',
  composition: '',
  notes: '',
};

export default function InventoryItemForm({ open, onOpenChange, item, onSave, isLoading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('details');

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const tradePayableAccount = accounts.find(a =>
    a.name?.toLowerCase().includes('trade payable') ||
    (a.type === 'liability' && a.category === 'current_liability' && a.name?.toLowerCase().includes('payable'))
  );
  const suppliers = accounts.filter(a => a.parentAccount === tradePayableAccount?.id && a.active !== false);

  useEffect(() => {
    if (item) {
      setForm({ ...EMPTY_FORM, ...item });
    } else {
      setForm(EMPTY_FORM);
    }
    setActiveTab('details');
  }, [item, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalValue = (form.quantity_on_hand || 0) * (form.average_cost || form.purchase_price || form.mrp || 0);
    onSave({ ...form, total_value: totalValue });
  };

  // Computed display value
  const stockValue = (form.quantity_on_hand || 0) * (form.average_cost || form.purchase_price || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{item ? 'Edit Item' : 'New Inventory Item'}</DialogTitle>
            {item && (
              <div className="flex items-center gap-2 mr-8">
                <span className="text-sm text-slate-500">Active</span>
                <Switch
                  checked={form.is_active !== false}
                  onCheckedChange={(v) => set('is_active', v)}
                />
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Item Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
              <TabsTrigger value="stock">Stock & Procurement</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Item Details ── */}
            <TabsContent value="details" className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                    placeholder="e.g., FAB-COT-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g., Cotton Twill 58&quot; 180GSM"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsnCode">HSN / SAC Code</Label>
                  <Input
                    id="hsnCode"
                    value={form.hsnCode || ''}
                    onChange={(e) => set('hsnCode', e.target.value)}
                    placeholder="e.g., 5208"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_category">Sub-Category</Label>
                  <Input
                    id="sub_category"
                    value={form.sub_category || ''}
                    onChange={(e) => set('sub_category', e.target.value)}
                    placeholder="e.g., Cotton"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Item Type *</Label>
                  <Select value={form.item_type || 'raw_material'} onValueChange={(v) => set('item_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {itemTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unit of Measure *</Label>
                  <Select value={form.unit} onValueChange={(v) => set('unit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="styleID">Style ID</Label>
                  <Input
                    id="styleID"
                    value={form.styleID || ''}
                    onChange={(e) => set('styleID', e.target.value)}
                    placeholder="Style ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="articleNo">Article No</Label>
                  <Input
                    id="articleNo"
                    value={form.articleNo || ''}
                    onChange={(e) => set('articleNo', e.target.value)}
                    placeholder="Article number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ean">EAN / Barcode</Label>
                  <Input
                    id="ean"
                    value={form.ean || ''}
                    onChange={(e) => set('ean', e.target.value)}
                    placeholder="EAN barcode"
                  />
                </div>
                {!item && (
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="is_active"
                      checked={form.is_active !== false}
                      onCheckedChange={(v) => set('is_active', v)}
                    />
                    <Label htmlFor="is_active">Active item</Label>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Tab 2: Pricing & Tax ── */}
            <TabsContent value="pricing" className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase / Cost Price (₹) *</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchase_price || ''}
                    onChange={(e) => set('purchase_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500">Standard cost used on PO lines</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrp">MRP / List Price (₹)</Label>
                  <Input
                    id="mrp"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.mrp || ''}
                    onChange={(e) => set('mrp', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500">Maximum retail / selling price</p>
                </div>
                <div className="space-y-2">
                  <Label>GST Rate</Label>
                  <Select
                    value={String(form.tax_rate ?? 5)}
                    onValueChange={(v) => set('tax_rate', Number(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {gstRates.map((r) => (
                        <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Pre-fills GST% on PO lines</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valuation Method</Label>
                  <Select value={form.valuation_method || 'weighted_average'} onValueChange={(v) => set('valuation_method', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {valuationMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">How cost is calculated on stock receipts</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="average_cost">
                    Average Cost (₹)
                    <span className="ml-1 text-xs text-slate-400">(auto-computed on GRN)</span>
                  </Label>
                  <Input
                    id="average_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.average_cost || ''}
                    onChange={(e) => set('average_cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-slate-50"
                  />
                </div>
              </div>

              {/* Stock value preview */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Stock Valuation Preview</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Qty on Hand</p>
                    <p className="font-semibold text-slate-900">{form.quantity_on_hand || 0} {form.unit}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Cost per Unit</p>
                    <p className="font-semibold text-slate-900">₹{(form.average_cost || form.purchase_price || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Stock Value</p>
                    <p className="font-semibold text-emerald-700">₹{stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Stock & Procurement ── */}
            <TabsContent value="stock" className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity_on_hand">Opening Stock Qty</Label>
                  <Input
                    id="quantity_on_hand"
                    type="number"
                    min="0"
                    value={form.quantity_on_hand}
                    onChange={(e) => set('quantity_on_hand', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-slate-500">Updated automatically via GRN</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_level">Reorder Level</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={(e) => set('reorder_level', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-slate-500">Alert threshold for low stock</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_order_qty">Minimum Order Qty (MOQ)</Label>
                  <Input
                    id="minimum_order_qty"
                    type="number"
                    min="1"
                    value={form.minimum_order_qty || 1}
                    onChange={(e) => set('minimum_order_qty', parseFloat(e.target.value) || 1)}
                  />
                  <p className="text-xs text-slate-500">Minimum qty per purchase order</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    min="0"
                    value={form.lead_time_days || 7}
                    onChange={(e) => set('lead_time_days', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-slate-500">Avg days from PO to delivery</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse_location">Warehouse / Bin Location</Label>
                  <Input
                    id="warehouse_location"
                    value={form.warehouse_location || ''}
                    onChange={(e) => set('warehouse_location', e.target.value)}
                    placeholder="e.g., A-1-2 or Zone B"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Supplier</Label>
                <Select
                  value={form.supplier || ''}
                  onValueChange={(v) => set('supplier', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Low stock alert indicator */}
              {form.quantity_on_hand > 0 && form.reorder_level > 0 && (
                <div className={`rounded-lg border p-3 flex items-center gap-3 ${
                  form.quantity_on_hand <= form.reorder_level
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-emerald-200 bg-emerald-50'
                }`}>
                  <span className={`text-sm font-medium ${
                    form.quantity_on_hand <= form.reorder_level ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {form.quantity_on_hand <= form.reorder_level
                      ? `Low stock — current qty (${form.quantity_on_hand}) is at or below reorder level (${form.reorder_level})`
                      : `Stock OK — ${form.quantity_on_hand - form.reorder_level} ${form.unit} above reorder level`
                    }
                  </span>
                </div>
              )}
            </TabsContent>

            {/* ── Tab 4: Attributes ── */}
            <TabsContent value="attributes" className="space-y-4 pt-2">
              {(form.category === 'fabric' || form.category === 'garments' || form.category === 'trims') && (
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="col-span-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                      {form.category === 'fabric' ? 'Fabric Attributes' : form.category === 'garments' ? 'Garment Attributes' : 'Product Attributes'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={form.color || ''}
                      onChange={(e) => set('color', e.target.value)}
                      placeholder="e.g., Navy Blue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size / Width</Label>
                    <Input
                      id="size"
                      value={form.size || ''}
                      onChange={(e) => set('size', e.target.value)}
                      placeholder='e.g., 58" or XL'
                    />
                  </div>
                  {form.category === 'fabric' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="gsm">GSM</Label>
                        <Input
                          id="gsm"
                          value={form.gsm || ''}
                          onChange={(e) => set('gsm', e.target.value)}
                          placeholder="e.g., 180"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="composition">Composition</Label>
                        <Input
                          id="composition"
                          value={form.composition || ''}
                          onChange={(e) => set('composition', e.target.value)}
                          placeholder="e.g., 100% Cotton"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Description</Label>
                <Textarea
                  id="notes"
                  value={form.notes || ''}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Any additional notes about this item..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#1E3A8A] hover:bg-[#1e3a5f] text-white"
            >
              {isLoading ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
