import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";

export default function PurchaseOrderPrintView({ open, onOpenChange, poData }) {
  const handlePrint = () => {
    window.print();
  };

  if (!poData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-white border-b p-4 flex justify-between items-center print:hidden">
          <h2 className="text-lg font-semibold">Purchase Order Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        <div className="p-8 bg-white" id="po-print-content">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d1c12e7412aa1b6e6ab01/10ee209f4_Fyndcreatelogo.png" 
                alt="Fynd Logo" 
                className="h-16 object-contain"
              />
            </div>
            <div className="text-right text-sm">
              <p className="font-bold text-base">Shopsense Retail Technologies Ltd.</p>
              <p className="text-xs mt-1">1st Floor, Wework Vijay Diamond, Opp. SBI Branch, Cross Road B,</p>
              <p className="text-xs">Aji Nagar, Kondivita, Andheri East, Mumbai - 400093</p>
              <p className="text-xs">MOB: +91 9321 938 025 | CIN: U52900MH2012PLC236314</p>
              <p className="text-xs">GSTN : 27AALCA0442L1ZM | PAN : AALCA0442L</p>
            </div>
          </div>

          {/* Purchase Order Title */}
          <h1 className="text-3xl font-bold text-center mb-8">Purchase Order</h1>

          {/* Vendor and PO Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-sm mb-3 underline">Vendor details</h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{poData.supplier_name || '-'}</p>
                <p>{poData.supplier_address || '-'}</p>
                <p>{poData.supplier_city || ''} {poData.supplier_country || ''}</p>
                {poData.supplier_gstid && <p>GSTN: {poData.supplier_gstid}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3 underline">PO details</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">PO Number:</span> {poData.po_number || 'Draft'}</p>
                <p><span className="font-semibold">PO Date:</span> {poData.po_date ? format(new Date(poData.po_date), 'MMMM dd, yyyy') : '-'}</p>
                <p><span className="font-semibold">Expected Delivery by As specified</span></p>
                {poData.order_form_no && <p><span className="font-semibold">Order Form No:</span> {poData.order_form_no}</p>}
                <p><span className="font-semibold">Payment Terms:</span> {poData.payment_terms?.replace('net_', '') || '30'} days</p>
              </div>
            </div>
          </div>

          {/* Billing and Shipping Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-sm mb-3 underline">Billing details</h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">Shopsense Retail Technologies Limited</p>
                <p>1st Floor, Wework Vijay Diamond, Opp. SBI Branch, Cross Road B,</p>
                <p>Aji Nagar, Kondivita, Andheri East, Mumbai - 400093, Maharashtra</p>
                <p>GSTN No. 27AALCA0442L1ZM</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3 underline">Shipping details</h3>
              <div className="text-sm space-y-1">
                {poData.ship_to && <p className="font-semibold">{poData.ship_to}</p>}
                {poData.shipping_address ? (
                  <p className="whitespace-pre-line">{poData.shipping_address}</p>
                ) : (
                  <p>As per billing address</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-2 text-left font-bold">Style ID</th>
                  <th className="border border-slate-300 p-2 text-left font-bold">Size</th>
                  <th className="border border-slate-300 p-2 text-left font-bold">Description</th>
                  <th className="border border-slate-300 p-2 text-left font-bold">Color</th>
                  <th className="border border-slate-300 p-2 text-left font-bold">HSN code</th>
                  <th className="border border-slate-300 p-2 text-left font-bold">Expected Delivery</th>
                  <th className="border border-slate-300 p-2 text-right font-bold">Qty</th>
                  <th className="border border-slate-300 p-2 text-right font-bold">Per Unit Rate</th>
                  <th className="border border-slate-300 p-2 text-right font-bold">Net before GST</th>
                  <th className="border border-slate-300 p-2 text-right font-bold">GST%</th>
                  <th className="border border-slate-300 p-2 text-right font-bold">Total Amt</th>
                </tr>
              </thead>
              <tbody>
                {poData.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-2">{item.styleID || '-'}</td>
                    <td className="border border-slate-300 p-2">{item.size || '-'}</td>
                    <td className="border border-slate-300 p-2">{item.description || '-'}</td>
                    <td className="border border-slate-300 p-2">{item.color || '-'}</td>
                    <td className="border border-slate-300 p-2">{item.hsnCode || '-'}</td>
                    <td className="border border-slate-300 p-2">
                      {item.item_expected_delivery ? format(new Date(item.item_expected_delivery), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="border border-slate-300 p-2 text-right">{item.quantity || 0}</td>
                    <td className="border border-slate-300 p-2 text-right">{(item.rate_per_unit || 0).toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right">{(item.net_before_gst || 0).toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right">{(item.gst_percentage || 0).toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right font-medium">{(item.gross_value || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="text-right mt-4 pr-4">
              <p className="text-sm font-bold">Grand Total: {poData.total_amount?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-8 text-xs space-y-2">
            <p className="font-semibold">Terms & Conditions :</p>
            {poData.notes ? (
              <p className="whitespace-pre-line">{poData.notes}</p>
            ) : (
              <>
                <p>1. Payment shall be made within {poData.payment_terms?.replace('net_', '') || '30'} days from the date of receipt of the invoice.</p>
                <p>2. GST shall be levied as per the applicable GST% extra on the above charges.</p>
                <p>3. All payments shall be subject to applicable TDS deductions in accordance with prevailing rules and regulations under applicable law.</p>
                <p>4. Acceptance of invoices under this Purchase Order shall be subject to actual receipt of the goods/services and invoices with proper approvals.</p>
                <p>5. This Purchase Order shall be governed by the terms of the Service Agreement, together with any amendments thereto, executed between the parties.</p>
              </>
            )}
          </div>

          {/* Signature */}
          <div className="text-right mt-12">
            <div className="inline-block text-sm">
              <p className="font-semibold">For Fynd:</p>
              <div className="mt-12 border-t border-slate-300 pt-2">
                <p className="font-semibold">Authorized Signatory</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-500 text-center">
            <p>This is computer generated copy, signature is not mandatory</p>
          </div>
        </div>
      </DialogContent>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #po-print-content, #po-print-content * {
            visibility: visible;
          }
          #po-print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}