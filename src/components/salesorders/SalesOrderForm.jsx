import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import GaasLineItemsUpload from "./GaasLineItemsUpload";
import SalesOrderPrintView from "./SalesOrderPrintView";
import { Upload, Trash2, Eye } from "lucide-react";

export default function SalesOrderForm({ open, onOpenChange, order, accounts = [], onSave, isLoading, viewMode = false }) {
  const [form, setForm] = useState({
    orderFormNo: '',
    customerCode: '',
    customerName: '',
    customerBrand: '',
    customerAddress: '',
    customerCountry: '',
    customerGstId: '',
    orderFormValue: 0,
    paymentTerm: 'net_30',
    paymentTermFrom: '',
    expectedDelivery: '',
    orderTerm: '1_year',
    startDate: '',
    endDate: '',
    autoRenewal: 'No',
    leadSource: 'Direct',
    partnerName: '',
    salesPersonName: '',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    serviceName: 'DaaS',
    uom: 'SKU',
    inclusions: '',
    unitPrice: 0,
    billingFrequency: 'One_Time',
    specialTerms: '',
    gaasLineItems: [],
    status: 'draft',
    currency: 'USD',
    notes: '',
    attachments: []
  });
  
  const [showGaasUpload, setShowGaasUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (order) {
      setForm({ ...order, gaasLineItems: order.gaasLineItems || [] });
    } else {
      setForm({
        orderFormNo: '',
        customerCode: '',
        customerName: '',
        customerBrand: '',
        customerAddress: '',
        customerCountry: '',
        customerGstId: '',
        orderFormValue: 0,
        paymentTerm: 'net_30',
        paymentTermFrom: '',
        expectedDelivery: '',
        orderTerm: '1_year',
        startDate: '',
        endDate: '',
        autoRenewal: 'No',
        leadSource: 'Direct',
        partnerName: '',
        salesPersonName: '',
        contactPersonName: '',
        contactPersonEmail: '',
        contactPersonPhone: '',
        serviceName: 'DaaS',
        uom: 'SKU',
        inclusions: '',
        unitPrice: 0,
        billingFrequency: 'One_Time',
        specialTerms: '',
        gaasLineItems: [],
        status: 'draft',
        currency: 'USD',
        notes: '',
        attachments: []
      });
    }
  }, [order, open]);

  const handleCustomerCodeChange = (code) => {
    setForm({ ...form, customerCode: code });
    
    // Auto-fetch customer details from Account
    const customer = accounts.find(a => a.code === code);
    if (customer) {
      setForm(prev => ({
        ...prev,
        customerCode: code,
        customerName: customer.name || '',
        customerBrand: customer.brand || '',
        customerAddress: customer.address || '',
        customerCountry: customer.country || '',
        customerGstId: customer.gstId || '',
        currency: customer.currency || 'USD',
        paymentTerm: customer.paymentTerms || 'net_30',
        contactPersonName: customer.contactPerson || '',
        contactPersonPhone: customer.phone || '',
        contactPersonEmail: customer.email || ''
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), { name: file.name, url: file_url }]
      }));
    } catch (error) {
      alert('Failed to upload file');
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">ORDER FORM</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section A: Client & Order Form Details */}
          <div className="border-2 border-[#0f172a] rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 pb-2 border-b-2 border-[#0f172a]">
              A. Client & Order Form Details
            </h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Label className="w-32 text-sm font-semibold pt-2 shrink-0">Client Name</Label>
                  <span className="pt-2">:</span>
                  <Select value={form.customerCode} onValueChange={handleCustomerCodeChange} disabled={viewMode}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.code === '10001' || (a.parentAccount && accounts.find(p => p.id === a.parentAccount)?.code === '10001')).map((acc) => (
                        <SelectItem key={acc.id} value={acc.code}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-32 text-sm font-semibold pt-2 shrink-0">Brand/Trade Name</Label>
                  <span className="pt-2">:</span>
                  <Input value={form.customerBrand} onChange={(e) => setForm({ ...form, customerBrand: e.target.value })} disabled={viewMode} className="flex-1" />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-32 text-sm font-semibold pt-2 shrink-0">Billing Address</Label>
                  <span className="pt-2">:</span>
                  <Textarea value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} disabled={viewMode} className="flex-1" rows={2} />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-32 text-sm font-semibold pt-2 shrink-0">Tax Details</Label>
                  <span className="pt-2">:</span>
                  <Input value={form.customerGstId} onChange={(e) => setForm({ ...form, customerGstId: e.target.value })} disabled={viewMode} className="flex-1" placeholder="GST ID" />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-32 text-sm font-semibold pt-2 shrink-0">Billing Email</Label>
                  <span className="pt-2">:</span>
                  <Input value={form.contactPersonEmail} onChange={(e) => setForm({ ...form, contactPersonEmail: e.target.value })} disabled={viewMode} className="flex-1" />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-32 text-sm font-semibold pt-2 shrink-0">Order Form Term</Label>
                  <span className="pt-2">:</span>
                  <Select value={form.orderTerm} onValueChange={(v) => setForm({ ...form, orderTerm: v })} disabled={viewMode}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6_months">6 Months</SelectItem>
                      <SelectItem value="1_year">1 Year</SelectItem>
                      <SelectItem value="2_years">2 Years</SelectItem>
                      <SelectItem value="3_years">3 Years</SelectItem>
                      <SelectItem value="5_years">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-32 text-sm font-semibold pt-2 shrink-0">PO Required</Label>
                  <span className="pt-2">:</span>
                  <Select value="No" disabled className="flex-1">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Order Form No</Label>
                  <span className="pt-2">:</span>
                  <Input value={form.orderFormNo} onChange={(e) => setForm({ ...form, orderFormNo: e.target.value })} required disabled={viewMode} className="flex-1" />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Billing Currency</Label>
                  <span className="pt-2">:</span>
                  <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} disabled={viewMode} className="flex-1" />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Service Period</Label>
                  <span className="pt-2">:</span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Start:</Label>
                      <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} disabled={viewMode} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">End:</Label>
                      <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} disabled={viewMode} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Sales Channel</Label>
                  <span className="pt-2">:</span>
                  <Select value={form.leadSource} onValueChange={(v) => setForm({ ...form, leadSource: v })} disabled={viewMode}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direct">Direct</SelectItem>
                      <SelectItem value="Indirect">Indirect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Order Form Value</Label>
                  <span className="pt-2">:</span>
                  <Input type="number" step="0.01" value={form.orderFormValue} onChange={(e) => setForm({ ...form, orderFormValue: parseFloat(e.target.value) || 0 })} disabled={viewMode} className="flex-1" />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Auto Renewal</Label>
                  <span className="pt-2">:</span>
                  <Select value={form.autoRenewal} onValueChange={(v) => setForm({ ...form, autoRenewal: v })} disabled={viewMode}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Renewal Frequency</Label>
                  <span className="pt-2">:</span>
                  <Input value="NA" disabled className="flex-1 bg-slate-50" />
                </div>

                <div className="flex items-start gap-3">
                  <Label className="w-40 text-sm font-semibold pt-2 shrink-0">Payment Terms</Label>
                  <span className="pt-2">:</span>
                  <Select value={form.paymentTerm} onValueChange={(v) => setForm({ ...form, paymentTerm: v })} disabled={viewMode}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_advance">Full Advance</SelectItem>
                      <SelectItem value="net_7">Net 7</SelectItem>
                      <SelectItem value="net_30">Net 30</SelectItem>
                      <SelectItem value="net_45">Net 45</SelectItem>
                      <SelectItem value="net_60">Net 60</SelectItem>
                      <SelectItem value="net_90">Net 90</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Client & Sales Representative */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 pt-6 border-t-2 border-slate-200">
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Client Representative</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Name:</span>
                  <Input value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} disabled={viewMode} className="flex-1" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Mobile:</span>
                  <Input value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} disabled={viewMode} className="flex-1" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Email:</span>
                  <Input type="email" value={form.contactPersonEmail} onChange={(e) => setForm({ ...form, contactPersonEmail: e.target.value })} disabled={viewMode} className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm">Sales Representative</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Name:</span>
                  <Input value={form.salesPersonName} onChange={(e) => setForm({ ...form, salesPersonName: e.target.value })} disabled={viewMode} className="flex-1" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Email:</span>
                  <Input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} disabled={viewMode} placeholder="partner@example.com" className="flex-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Service Details */}
          <div className="border-2 border-[#0f172a] rounded-lg p-6 space-y-4">
            <div className="pb-2 border-b-2 border-[#0f172a]">
              <h3 className="text-lg font-bold text-slate-900">B. Service Details</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-semibold w-32">Service Name</Label>
                <Select value={form.serviceName} onValueChange={(v) => setForm({ ...form, serviceName: v })} disabled={viewMode}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DaaS">DaaS</SelectItem>
                    <SelectItem value="GaaS">GaaS</SelectItem>
                    <SelectItem value="AI Photoshoot">AI Photoshoot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service Details Table - GaaS */}
              {form.serviceName === 'GaaS' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Line Items</Label>
                    {!viewMode && (
                      <Button type="button" onClick={() => setShowGaasUpload(true)} size="sm" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Upload Items
                      </Button>
                    )}
                  </div>

                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm table-fixed">
                        <thead className="bg-slate-100 border-b border-slate-300">
                          <tr>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '100px' }}>Item Code</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '100px' }}>Article No</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '100px' }}>Style ID</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '120px' }}>Item Category</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '120px' }}>Item Name</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '150px' }}>Description</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '120px' }}>Composition</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '80px' }}>Size</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '100px' }}>Color</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '100px' }}>HSN</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '80px' }}>Qty</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '100px' }}>Rate</th>
                            <th className="p-2 text-left font-bold border-r border-slate-300 resize-x overflow-auto" style={{ width: '130px' }}>Expected Delivery Date</th>
                            {!viewMode && <th className="p-2 text-left font-bold w-12"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {form.gaasLineItems?.length > 0 ? (
                            form.gaasLineItems.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-200">
                                <td className="p-2 border-r border-slate-200">{item.itemCode || '-'}</td>
                                <td className="p-2 border-r border-slate-200">{item.articleNo || '-'}</td>
                                <td className="p-2 border-r border-slate-200">{item.styleID || '-'}</td>
                                <td className="p-2 border-r border-slate-200">{item.itemCategory || '-'}</td>
                                <td className="p-2 border-r border-slate-200">{item.itemName}</td>
                                <td className="p-2 border-r border-slate-200">{item.description}</td>
                                <td className="p-2 border-r border-slate-200">{item.composition}</td>
                                <td className="p-2 border-r border-slate-200">{item.size}</td>
                                <td className="p-2 border-r border-slate-200">{item.color}</td>
                                <td className="p-2 border-r border-slate-200">{item.hsnCode}</td>
                                <td className="p-2 border-r border-slate-200">{item.quantity}</td>
                                <td className="p-2 border-r border-slate-200">{item.rate}</td>
                                <td className="p-2 border-r border-slate-200">{item.expectedDeliveryDate || '-'}</td>
                                {!viewMode && (
                                  <td className="p-2">
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        const newItems = form.gaasLineItems.filter((_, i) => i !== idx);
                                        setForm({ ...form, gaasLineItems: newItems });
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-500" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={viewMode ? 13 : 14} className="p-6 text-center text-slate-400">
                                No line items added. Use bulk upload to add items.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {form.gaasLineItems?.length > 0 && (
                    <div className="text-right text-sm">
                      <span className="font-semibold">Total Items: </span>
                      <span>{form.gaasLineItems.length}</span>
                      <span className="ml-4 font-semibold">Total Qty: </span>
                      <span>{form.gaasLineItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                      <span className="ml-4 font-semibold">Total Value: </span>
                      <span>{form.gaasLineItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Service Details Table - Other Services */
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 bg-slate-100 border-b border-slate-300">
                    <div className="p-3 border-r border-slate-300 font-bold text-sm">Fee Type</div>
                    <div className="p-3 border-r border-slate-300 font-bold text-sm">Billing Cycle</div>
                    <div className="p-3 border-r border-slate-300 font-bold text-sm">Commercial Value</div>
                    <div className="p-3 border-r border-slate-300 font-bold text-sm">Inclusions</div>
                    <div className="p-3 font-bold text-sm">Terms</div>
                  </div>
                  <div className="grid grid-cols-5">
                    <div className="p-3 border-r border-slate-300">
                      <Select value={form.uom} onValueChange={(v) => setForm({ ...form, uom: v })} disabled={viewMode}>
                        <SelectTrigger className="border-0 h-8 p-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="One-Time Fee">One-Time Fee</SelectItem>
                          <SelectItem value="SKU">Per SKU</SelectItem>
                          <SelectItem value="Tech_pack">Per Tech Pack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-3 border-r border-slate-300">
                      <Select value={form.billingFrequency} onValueChange={(v) => setForm({ ...form, billingFrequency: v })} disabled={viewMode}>
                        <SelectTrigger className="border-0 h-8 p-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="One_Time">One Time</SelectItem>
                          <SelectItem value="ARR">Annual</SelectItem>
                          <SelectItem value="MRR">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-3 border-r border-slate-300">
                      <Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} disabled={viewMode} className="border-0 h-8 p-0" />
                    </div>
                    <div className="p-3 border-r border-slate-300">
                      <Textarea value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} disabled={viewMode} rows={2} className="border-0 p-0 text-sm" placeholder="e.g., 1 Lifestyle Shoot + 6 Studio Shoot" />
                    </div>
                    <div className="p-3">
                      <Textarea value={form.specialTerms} onChange={(e) => setForm({ ...form, specialTerms: e.target.value })} disabled={viewMode} rows={2} className="border-0 p-0 text-sm" placeholder="e.g., 50% On Execution" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4">
                <Label className="text-sm font-semibold">Additional Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={viewMode} rows={3} placeholder="Any additional terms or notes..." />
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end pt-4 gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <>
                <Button type="button" variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-[#0f172a] hover:bg-[#1e3a5f]">
                  {isLoading ? 'Saving...' : (order ? 'Update Order Form' : 'Create Order Form')}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>

        <GaasLineItemsUpload
          open={showGaasUpload}
          onOpenChange={setShowGaasUpload}
          onSuccess={(items) => {
            setForm({ ...form, gaasLineItems: [...(form.gaasLineItems || []), ...items] });
          }}
        />

        <SalesOrderPrintView
          open={showPreview}
          onOpenChange={setShowPreview}
          order={form}
        />
      </DialogContent>
    </Dialog>
  );
}