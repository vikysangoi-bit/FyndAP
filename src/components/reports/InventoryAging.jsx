import React from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default function InventoryAging({ items, transactions, asOfDate }) {
  const calculateAging = (item) => {
    const lastReceived = transactions
      .filter(t => t.item_id === item.id && t.type === 'receipt')
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];
    
    const lastIssued = transactions
      .filter(t => t.item_id === item.id && t.type === 'issue')
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

    const lastActivityDate = lastIssued?.transaction_date || lastReceived?.transaction_date;
    const daysInStock = lastActivityDate 
      ? Math.floor((new Date(asOfDate) - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24))
      : 0;

    const value = item.quantity_on_hand * item.unit_cost;

    return {
      item,
      daysInStock,
      value,
      lastActivityDate
    };
  };

  const agingData = items
    .filter(item => item.quantity_on_hand > 0)
    .map(calculateAging)
    .sort((a, b) => b.daysInStock - a.daysInStock);

  const getAgingCategory = (days) => {
    if (days > 180) return { label: 'Over 180 Days', color: 'bg-rose-100 text-rose-700', priority: 'high' };
    if (days > 90) return { label: '90-180 Days', color: 'bg-amber-100 text-amber-700', priority: 'medium' };
    if (days > 60) return { label: '60-90 Days', color: 'bg-yellow-100 text-yellow-700', priority: 'low' };
    if (days > 30) return { label: '30-60 Days', color: 'bg-blue-100 text-blue-700', priority: 'none' };
    return { label: 'Under 30 Days', color: 'bg-emerald-100 text-emerald-700', priority: 'none' };
  };

  const summary = {
    total: agingData.reduce((sum, d) => sum + d.value, 0),
    over180: agingData.filter(d => d.daysInStock > 180).reduce((sum, d) => sum + d.value, 0),
    between90_180: agingData.filter(d => d.daysInStock > 90 && d.daysInStock <= 180).reduce((sum, d) => sum + d.value, 0),
    between60_90: agingData.filter(d => d.daysInStock > 60 && d.daysInStock <= 90).reduce((sum, d) => sum + d.value, 0),
    under60: agingData.filter(d => d.daysInStock <= 60).reduce((sum, d) => sum + d.value, 0),
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Inventory Aging Report</h2>
        <p className="text-slate-500">As of {asOfDate}</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">Total Value</p>
          <p className="text-lg font-bold">${summary.total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">Under 60 Days</p>
          <p className="text-lg font-bold text-emerald-700">${summary.under60.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">60-90 Days</p>
          <p className="text-lg font-bold text-yellow-700">${summary.between60_90.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">90-180 Days</p>
          <p className="text-lg font-bold text-amber-700">${summary.between90_180.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="p-4 bg-rose-50 rounded-lg text-center">
          <p className="text-xs text-slate-500 mb-1">Over 180 Days</p>
          <p className="text-lg font-bold text-rose-700">${summary.over180.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Days in Stock</TableHead>
            <TableHead>Age Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agingData.map((data) => {
            const category = getAgingCategory(data.daysInStock);
            return (
              <TableRow key={data.item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {category.priority === 'high' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                    <div>
                      <p className="font-medium">{data.item.name}</p>
                      <p className="text-xs text-slate-500">{data.item.sku}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">{data.item.quantity_on_hand} {data.item.unit}</TableCell>
                <TableCell className="text-right">${data.item.unit_cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">${data.value.toFixed(2)}</TableCell>
                <TableCell className="text-right">{data.daysInStock} days</TableCell>
                <TableCell>
                  <Badge className={category.color}>{category.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}