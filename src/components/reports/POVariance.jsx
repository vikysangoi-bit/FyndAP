import React from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function POVariance({ purchaseOrders, goodsReceipts, dateFrom, dateTo }) {
  const calculateVariance = () => {
    const data = [];
    
    purchaseOrders.forEach(po => {
      if (po.po_date >= dateFrom && po.po_date <= dateTo) {
        const relatedReceipts = goodsReceipts.filter(gr => gr.po_id === po.id);
        
        po.items?.forEach(poItem => {
          const totalReceived = relatedReceipts.reduce((sum, gr) => {
            const grItem = gr.items?.find(i => i.item_id === poItem.item_id);
            return sum + (grItem?.received_quantity || 0);
          }, 0);

          const qtyVariance = totalReceived - poItem.quantity;
          const qtyVariancePercent = poItem.quantity > 0 ? (qtyVariance / poItem.quantity) * 100 : 0;
          const valueVariance = qtyVariance * poItem.unit_price;

          data.push({
            po_number: po.po_number,
            supplier: po.supplier_name,
            item_name: poItem.item_name,
            item_sku: poItem.item_sku,
            ordered_qty: poItem.quantity,
            received_qty: totalReceived,
            qty_variance: qtyVariance,
            qty_variance_percent: qtyVariancePercent,
            unit_price: poItem.unit_price,
            value_variance: valueVariance,
            currency: po.currency,
            status: po.status
          });
        });
      }
    });

    return data.filter(d => Math.abs(d.qty_variance) > 0.01);
  };

  const varianceData = calculateVariance();

  const getVarianceStatus = (variance) => {
    const absVariance = Math.abs(variance);
    if (absVariance > 10) return { icon: AlertTriangle, color: 'text-rose-500', label: 'High' };
    if (absVariance > 5) return { icon: AlertTriangle, color: 'text-amber-500', label: 'Medium' };
    return { icon: CheckCircle, color: 'text-blue-500', label: 'Low' };
  };

  const summary = {
    totalVarianceValue: varianceData.reduce((sum, d) => sum + Math.abs(d.value_variance), 0),
    overReceived: varianceData.filter(d => d.qty_variance > 0).length,
    underReceived: varianceData.filter(d => d.qty_variance < 0).length
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">PO vs Goods Received Variance</h2>
        <p className="text-slate-500">{dateFrom} to {dateTo}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">Total Variance Value</p>
          <p className="text-lg font-bold">${summary.totalVarianceValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">Over Received</p>
          <p className="text-lg font-bold text-emerald-700">{summary.overReceived} items</p>
        </div>
        <div className="p-4 bg-rose-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">Under Received</p>
          <p className="text-lg font-bold text-rose-700">{summary.underReceived} items</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO / Item</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Ordered</TableHead>
            <TableHead className="text-right">Received</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">Variance %</TableHead>
            <TableHead className="text-right">Value Impact</TableHead>
            <TableHead>Severity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {varianceData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                No variances found for the selected period
              </TableCell>
            </TableRow>
          ) : (
            varianceData.map((data, i) => {
              const status = getVarianceStatus(data.qty_variance_percent);
              const Icon = status.icon;
              return (
                <TableRow key={i}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{data.po_number}</p>
                      <p className="text-xs text-slate-500">{data.item_name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{data.supplier}</TableCell>
                  <TableCell className="text-right">{data.ordered_qty}</TableCell>
                  <TableCell className="text-right">{data.received_qty}</TableCell>
                  <TableCell className={`text-right font-medium ${data.qty_variance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.qty_variance > 0 ? '+' : ''}{data.qty_variance.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${data.qty_variance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.qty_variance > 0 ? '+' : ''}{data.qty_variance_percent.toFixed(1)}%
                  </TableCell>
                  <TableCell className={`text-right font-medium ${data.value_variance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.currency} {Math.abs(data.value_variance).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${status.color}`} />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}