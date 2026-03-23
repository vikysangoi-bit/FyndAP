import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PurchaseOrderPrintView from "./PurchaseOrderPrintView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Eye, Upload } from "lucide-react";
import PurchaseOrderLineItemsUpload from "./PurchaseOrderLineItemsUpload";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function PurchaseOrderForm({ open, onOpenChange, po, onSave, isLoading }) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [showBulkUpload, setShowBulkUpload] = React.useState(false);
  const [form, setForm] = useState({
    po_number: '',
    po_date: new Date().toISOString().split('T')[0],
    order_form_no: '',
    supplier_id: '',
    supplier_code: '',
    supplier_name: '',
    delivery_date: '',
    ship_to: '',
    shipping_address: '',
    shipping_terms: 'Within India',
    payment_terms: 'net_30',
    currency: 'INR',
    items: [{
      itemCode: '',
      articleNo: '',
      styleID: '',
      itemCategory: '',
      description: '',
      composition: '',
      size: '',
      color: '',
      hsnCode: '',
      item_expected_delivery: '',
      quantity: 0,
      rate_per_unit: 0,
      net_before_gst: 0,
      gst_percentage: 0,
      gross_value: 0
    }],
    total_amount: 0,
    notes: ''
  });

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  // Filter suppliers with Trade Payable as parent (ID: 697babaff819e89ea60692b6)
  const suppliers = allAccounts.filter(acc => 
    acc.parentAccount === '697babaff819e89ea60692b6' && acc.active && !acc.is_deleted
  );

  useEffect(() => {
    if (po) {
      setForm({
        ...po,
        po_date: po.po_date || new Date().toISOString().split('T')[0],
        items: po.items || [{
          itemCode: '',
          articleNo: '',
          styleID: '',
          itemCategory: '',
          description: '',
          composition: '',
          size: '',
          color: '',
          hsnCode: '',
          item_expected_delivery: '',
          quantity: 0,
          rate_per_unit: 0,
          net_before_gst: 0,
          gst_percentage: 0,
          gross_value: 0
        }]
      });
    } else {
      setForm({
        po_number: '',
        po_date: new Date().toISOString().split('T')[0],
        order_form_no: '',
        supplier_id: '',
        supplier_code: '',
        supplier_name: '',
        delivery_date: '',
        ship_to: '',
        shipping_address: '',
        shipping_terms: 'Within India',
        payment_terms: 'net_30',
        currency: 'INR',
        items: [{
          article_no: '',
          style_id: '',
          item_category: '',
          description: '',
          composition: '',
          size: '',
          color: '',
          hsn_code: '',
          item_expected_delivery: '',
          quantity: 0,
          rate_per_unit: 0,
          net_before_gst: 0,
          gst_percentage: 0,
          gross_value: 0
        }],
        total_amount: 0,
        notes: ''
      });
    }
  }, [po, open]);

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setForm({
        ...form,
        supplier_id: supplierId,
        supplier_code: supplier.code || '',
        supplier_name: supplier.name || '',
        supplier_address: supplier.address || '',
        supplier_city: supplier.city || '',
        supplier_country: supplier.country || '',
        supplier_gstid: supplier.gstId || '',
        payment_terms: supplier.paymentTerms || 'net_30',
        currency: supplier.currency || 'INR'
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Calculate net_before_gst and gross_value when quantity or rate changes
    if (field === 'quantity' || field === 'rate_per_unit') {
      const qty = field === 'quantity' ? value : newItems[index].quantity || 0;
      const rate = field === 'rate_per_unit' ? value : newItems[index].rate_per_unit || 0;
      newItems[index].net_before_gst = qty * rate;
      
      const gstPerc = newItems[index].gst_percentage || 0;
      newItems[index].gross_value = newItems[index].net_before_gst * (1 + gstPerc / 100);
    }

    // Recalculate gross_value when gst_percentage changes
    if (field === 'gst_percentage') {
      const netValue = newItems[index].net_before_gst || 0;
      newItems[index].gross_value = netValue * (1 + value / 100);
    }

    const total_amount = newItems.reduce((sum, item) => sum + (item.gross_value || 0), 0);
    setForm({ ...form, items: newItems, total_amount });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, {
        itemCode: '',
        articleNo: '',
        styleID: '',
        itemCategory: '',
        description: '',
        composition: '',
        size: '',
        color: '',
        hsnCode: '',
        item_expected_delivery: '',
        quantity: 0,
        rate_per_unit: 0,
        net_before_gst: 0,
        gst_percentage: 0,
        gross_value: 0
      }]
    });
  };

  const removeItem = (index) => {
    if (form.items.length > 1) {
      const newItems = form.items.filter((_, i) => i !== index);
      const total_amount = newItems.reduce((sum, item) => sum + (item.gross_value || 0), 0);
      setForm({ ...form, items: newItems, total_amount });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Purchase Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor & PO Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-sm underline">Vendor details</h3>
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={form.supplier_id} onValueChange={handleSupplierChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.code} - {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm underline">PO details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input
                    value={form.po_number}
                    onChange={(e) => setForm({ ...form, po_number: e.target.value })}
                    placeholder="Auto-generated"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PO Date *</Label>
                  <Input
                    type="date"
                    value={form.po_date}
                    onChange={(e) => setForm({ ...form, po_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order Form No</Label>
                  <Input
                    value={form.order_form_no}
                    onChange={(e) => setForm({ ...form, order_form_no: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={form.delivery_date || ''}
                    onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Payment Terms</Label>
                  <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v })}>
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
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="pt-4 border-t">
            <div className="space-y-3">
              <h3 className="font-bold text-sm underline">Shipping details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Ship to</Label>
                  <Input
                    value={form.ship_to || ''}
                    onChange={(e) => setForm({ ...form, ship_to: e.target.value })}
                    placeholder="Location name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Shipping address</Label>
                  <Textarea
                    value={form.shipping_address || ''}
                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                    placeholder="Complete shipping address"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Shipping Terms</Label>
                  <Select value={form.shipping_terms} onValueChange={(v) => setForm({ ...form, shipping_terms: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Within India">Within India</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="FOB">FOB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <Card className="p-4 border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-slate-900">Order Items</h4>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowBulkUpload(true)}>
                  <Upload className="w-4 h-4 mr-1" /> Bulk Upload Items
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 table-fixed">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Item Code</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Article No.</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Style ID</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Item Category</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '150px' }}>Description</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '120px' }}>Composition</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '80px' }}>Size</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Color</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '130px' }}>Item Expected Delivery</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>HSN code</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '80px' }}>Qty</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Per Unit Rate</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Net before GST</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '80px' }}>GST%</th>
                    <th className="p-2 border border-slate-300 font-bold resize-x overflow-auto" style={{ width: '100px' }}>Total Amt</th>
                    <th className="p-2 border border-slate-300 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.itemCode || ''}
                          onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.articleNo || ''}
                          onChange={(e) => handleItemChange(index, 'articleNo', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.styleID || ''}
                          onChange={(e) => handleItemChange(index, 'styleID', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.itemCategory || ''}
                          onChange={(e) => handleItemChange(index, 'itemCategory', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.composition || ''}
                          onChange={(e) => handleItemChange(index, 'composition', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.size || ''}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.color || ''}
                          onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          type="date"
                          className="h-7 text-xs border-0"
                          value={item.item_expected_delivery || ''}
                          onChange={(e) => handleItemChange(index, 'item_expected_delivery', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          className="h-7 text-xs border-0"
                          value={item.hsnCode || ''}
                          onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          type="number"
                          className="h-7 text-xs border-0"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 text-xs border-0"
                          value={item.rate_per_unit || ''}
                          onChange={(e) => handleItemChange(index, 'rate_per_unit', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300 text-right">
                        <span className="text-xs">{(item.net_before_gst || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-1 border border-slate-300">
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 text-xs border-0"
                          value={item.gst_percentage || ''}
                          onChange={(e) => handleItemChange(index, 'gst_percentage', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-1 border border-slate-300 text-right">
                        <span className="text-xs font-medium">{(item.gross_value || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-1 border border-slate-300 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(index)}
                          disabled={form.items.length <= 1}
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-3 pr-4">
              <div className="text-sm">
                <span className="font-bold">Grand Total:</span>
                <span className="ml-4 font-bold">{form.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Terms & Notes */}
          <div className="space-y-2">
            <Label className="text-xs">Terms & Conditions / Additional Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="E.g., Payment shall be made within ___ days from the date of receipt of the invoice..."
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!form.supplier_id || form.items.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !form.supplier_id || form.items.length === 0}
              className="bg-[#0f172a] hover:bg-[#1e3a5f]"
            >
              {isLoading ? 'Saving...' : (po ? 'Update Purchase Order' : 'Create Purchase Order')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <PurchaseOrderPrintView 
        open={showPreview}
        onOpenChange={setShowPreview}
        poData={form}
      />

      <PurchaseOrderLineItemsUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onSuccess={(items) => {
          const newItems = [...form.items, ...items];
          const subtotal = newItems.reduce((sum, item) => sum + (item.net_before_gst || 0), 0);
          const taxAmount = newItems.reduce((sum, item) => sum + ((item.net_before_gst || 0) * (item.gst_percentage || 0) / 100), 0);
          const totalAmount = subtotal + taxAmount + (form.shipping_cost || 0);
          setForm({
            ...form,
            items: newItems,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount
          });
        }}
      />
    </Dialog>
  );
}