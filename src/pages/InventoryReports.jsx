import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import InventoryTurnover from "@/components/reports/InventoryTurnover";
import InventoryAging from "@/components/reports/InventoryAging";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, BarChart3, Clock } from "lucide-react";
import { format } from "date-fns";

export default function InventoryReports() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('turnover');

  const { data: items = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: () => base44.entities.InventoryTransaction.list()
  });

  const handleExport = () => {
    alert('Export functionality - would generate PDF/Excel export');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Inventory Reports" 
          subtitle="Turnover analysis, aging, and stock performance"
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

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-white/80 border">
            <TabsTrigger value="turnover" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Inventory Turnover
            </TabsTrigger>
            <TabsTrigger value="aging" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Inventory Aging
            </TabsTrigger>
          </TabsList>

          <TabsContent value="turnover" className="mt-6">
            <InventoryTurnover 
              items={items}
              transactions={transactions}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </TabsContent>

          <TabsContent value="aging" className="mt-6">
            <InventoryAging 
              items={items}
              transactions={transactions}
              asOfDate={format(new Date(dateTo), 'MMMM d, yyyy')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}