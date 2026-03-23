import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import POVariance from "@/components/reports/POVariance";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, AlertTriangle } from "lucide-react";

export default function PurchaseReports() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.list()
  });

  const { data: goodsReceipts = [] } = useQuery({
    queryKey: ['goods-receipts'],
    queryFn: () => base44.entities.GoodsReceipt.list()
  });

  const handleExport = () => {
    alert('Export functionality - would generate PDF/Excel export');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Purchase Reports" 
          subtitle="PO variance analysis and procurement insights"
        />

        {/* Filters */}
        <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Period From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Period To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleExport} className="w-full bg-slate-900 hover:bg-slate-800">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </Card>

        {/* Report */}
        <POVariance 
          purchaseOrders={purchaseOrders}
          goodsReceipts={goodsReceipts}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>
    </div>
  );
}