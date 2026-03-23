import React from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function InventoryTurnover({ items, transactions, dateFrom, dateTo }) {
  const calculateTurnover = (item) => {
    const itemTransactions = transactions.filter(t => 
      t.item_id === item.id && 
      t.type === 'issue' &&
      t.transaction_date >= dateFrom &&
      t.transaction_date <= dateTo
    );
    
    const totalIssued = itemTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const avgInventory = item.quantity_on_hand || 1;
    const turnoverRatio = avgInventory > 0 ? totalIssued / avgInventory : 0;
    const daysInPeriod = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24));
    const daysSalesInventory = turnoverRatio > 0 ? daysInPeriod / turnoverRatio : 0;

    return {
      item,
      totalIssued,
      avgInventory,
      turnoverRatio: turnoverRatio.toFixed(2),
      daysSalesInventory: daysSalesInventory.toFixed(0)
    };
  };

  const turnoverData = items.map(calculateTurnover)
    .sort((a, b) => parseFloat(b.turnoverRatio) - parseFloat(a.turnoverRatio));

  const getTurnoverStatus = (ratio) => {
    if (ratio > 6) return { label: 'Excellent', color: 'bg-emerald-100 text-emerald-700' };
    if (ratio > 4) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (ratio > 2) return { label: 'Average', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Slow', color: 'bg-rose-100 text-rose-700' };
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Inventory Turnover Report</h2>
        <p className="text-slate-500">{dateFrom} to {dateTo}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Current Stock</TableHead>
            <TableHead className="text-right">Units Issued</TableHead>
            <TableHead className="text-right">Turnover Ratio</TableHead>
            <TableHead className="text-right">Days in Stock</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {turnoverData.map((data) => {
            const status = getTurnoverStatus(parseFloat(data.turnoverRatio));
            return (
              <TableRow key={data.item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{data.item.name}</p>
                    <p className="text-xs text-slate-500">{data.item.sku}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{data.avgInventory} {data.item.unit}</TableCell>
                <TableCell className="text-right">{data.totalIssued} {data.item.unit}</TableCell>
                <TableCell className="text-right font-medium">{data.turnoverRatio}x</TableCell>
                <TableCell className="text-right">{data.daysSalesInventory} days</TableCell>
                <TableCell>
                  <Badge className={status.color}>{status.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}