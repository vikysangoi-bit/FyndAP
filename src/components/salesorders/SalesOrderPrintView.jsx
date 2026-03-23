import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function SalesOrderPrintView({ open, onOpenChange, order }) {
  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[210mm] max-h-[95vh] overflow-y-auto p-0">
        <div className="print:hidden sticky top-0 bg-white border-b flex items-center justify-between p-4 z-10">
          <h2 className="font-semibold text-lg">Print Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-8 bg-white print:p-0" id="print-content">
          {/* Header with Logo and Company Info */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-[#0f172a]">
            <div className="w-48">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d1c12e7412aa1b6e6ab01/c0ecc7ee4_image.png" 
                alt="Fynd Logo" 
                className="h-16 object-contain"
              />
            </div>
            <div className="text-right text-sm">
              <h1 className="text-xl font-bold mb-2">Shopsense Retail Technologies Ltd.</h1>
              <p className="text-xs leading-relaxed">
                1st Floor, Wework Vijay Diamond, Opp. SBI Branch, Cross Road B,<br />
                Ajit Nagar, Kondivita, Andheri East, Mumbai- 400093<br />
                MOB: +91 9321 938 025 | CIN: U52100MH2012PLC236314<br />
                GSTN: 27AALCA0442L1ZM | PAN: AALCA0442L
              </p>
            </div>
          </div>

          {/* Order Form Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">ORDER FORM</h2>
          </div>

          {/* Section A: Client & Order Form Details */}
          <div className="border-2 border-[#0f172a] rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b-2 border-[#0f172a] mb-4">
              A. Client & Order Form Details
            </h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {/* Left Column */}
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 font-semibold shrink-0">Client Name</span>
                  <span>: {order.customerName || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold shrink-0">Brand/Trade Name</span>
                  <span>: {order.customerBrand || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold shrink-0">Billing Address</span>
                  <span>: {order.customerAddress || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold shrink-0">Tax Details</span>
                  <span>: {order.customerGstId || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold shrink-0">Billing Email</span>
                  <span>: {order.contactPersonEmail || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold shrink-0">Order Form Term</span>
                  <span>: {order.orderTerm?.replace('_', ' ') || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold shrink-0">PO Required</span>
                  <span>: No</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Order Form No</span>
                  <span>: {order.orderFormNo || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Billing Currency</span>
                  <span>: {order.currency || 'USD'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Service Period</span>
                  <span>: {order.startDate ? new Date(order.startDate).toLocaleDateString() : '-'} to {order.endDate ? new Date(order.endDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Sales Channel</span>
                  <span>: {order.leadSource || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Order Form Value</span>
                  <span>: {order.orderFormValue || 0}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Auto Renewal</span>
                  <span>: {order.autoRenewal || 'No'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Renewal Frequency</span>
                  <span>: NA</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold shrink-0">Payment Terms</span>
                  <span>: {order.paymentTerm?.replace('_', ' ') || '-'}</span>
                </div>
              </div>
            </div>

            {/* Representatives */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 pt-4 border-t-2 border-slate-200 text-sm">
              <div>
                <h4 className="font-bold mb-2">Client Representative</h4>
                <div className="space-y-1">
                  <div><span className="font-semibold">Name:</span> {order.contactPersonName || '-'}</div>
                  <div><span className="font-semibold">Mobile:</span> {order.contactPersonPhone || '-'}</div>
                  <div><span className="font-semibold">Email:</span> {order.contactPersonEmail || '-'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-2">Sales Representative</h4>
                <div className="space-y-1">
                  <div><span className="font-semibold">Name:</span> {order.salesPersonName || '-'}</div>
                  <div><span className="font-semibold">Email:</span> {order.partnerName || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Service Details */}
          <div className="border-2 border-[#0f172a] rounded-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b-2 border-[#0f172a] mb-4">
              B. Service Details
            </h3>

            <div className="mb-4">
              <span className="font-semibold text-sm">Service Name: </span>
              <span className="text-sm">{order.serviceName || '-'}</span>
            </div>

            {/* GaaS Line Items Table */}
            {order.serviceName === 'GaaS' && order.gaasLineItems?.length > 0 ? (
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Style ID</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Item Name</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Description</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Composition</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Size</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Color</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">HSN</th>
                      <th className="p-2 text-left font-bold border-r border-slate-300">Qty</th>
                      <th className="p-2 text-left font-bold">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.gaasLineItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200">{item.styleId}</td>
                        <td className="p-2 border-r border-slate-200">{item.itemName}</td>
                        <td className="p-2 border-r border-slate-200">{item.description}</td>
                        <td className="p-2 border-r border-slate-200">{item.composition}</td>
                        <td className="p-2 border-r border-slate-200">{item.size}</td>
                        <td className="p-2 border-r border-slate-200">{item.color}</td>
                        <td className="p-2 border-r border-slate-200">{item.hsn}</td>
                        <td className="p-2 border-r border-slate-200">{item.quantity}</td>
                        <td className="p-2">{item.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 bg-slate-50 text-right text-xs border-t border-slate-300">
                  <span className="font-semibold">Total Items: </span>
                  <span>{order.gaasLineItems.length}</span>
                  <span className="ml-4 font-semibold">Total Qty: </span>
                  <span>{order.gaasLineItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                  <span className="ml-4 font-semibold">Total Value: </span>
                  <span>{order.gaasLineItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              /* Other Services Table */
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 bg-slate-100 border-b border-slate-300">
                  <div className="p-3 border-r border-slate-300 font-bold text-xs">Fee Type</div>
                  <div className="p-3 border-r border-slate-300 font-bold text-xs">Billing Cycle</div>
                  <div className="p-3 border-r border-slate-300 font-bold text-xs">Commercial Value</div>
                  <div className="p-3 border-r border-slate-300 font-bold text-xs">Inclusions</div>
                  <div className="p-3 font-bold text-xs">Terms</div>
                </div>
                <div className="grid grid-cols-5">
                  <div className="p-3 border-r border-slate-300 text-xs">{order.uom || '-'}</div>
                  <div className="p-3 border-r border-slate-300 text-xs">{order.billingFrequency?.replace('_', ' ') || '-'}</div>
                  <div className="p-3 border-r border-slate-300 text-xs">{order.unitPrice || 0}</div>
                  <div className="p-3 border-r border-slate-300 text-xs">{order.inclusions || '-'}</div>
                  <div className="p-3 text-xs">{order.specialTerms || '-'}</div>
                </div>
              </div>
            )}

            {order.notes && (
              <div className="mt-4 text-sm">
                <span className="font-semibold">Additional Notes: </span>
                <p className="mt-1 text-slate-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Footer - Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-300">
            <div className="text-center">
              <div className="border-t-2 border-[#0f172a] pt-2 mt-16">
                <p className="font-semibold text-sm">Client Signature</p>
                <p className="text-xs text-slate-500">({order.customerName})</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-[#0f172a] pt-2 mt-16">
                <p className="font-semibold text-sm">Authorized Signatory</p>
                <p className="text-xs text-slate-500">(Shopsense Retail Technologies Ltd.)</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}