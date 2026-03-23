import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import BalanceSheet from "@/components/reports/BalanceSheet";
import IncomeStatement from "@/components/reports/IncomeStatement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function FinancialReports() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [activeTab, setActiveTab] = useState('balance-sheet');

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => base44.entities.JournalEntry.list()
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list()
  });

  const handleExport = () => {
    alert('Export functionality - would generate PDF/Excel export');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Financial Reports" 
          subtitle="Balance sheet, income statement, and cash flow analysis"
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
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
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
          <TabsList className="grid w-full grid-cols-3 bg-white/80 border">
            <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="income-statement" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Income Statement
            </TabsTrigger>
            <TabsTrigger value="cash-flow" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balance-sheet" className="mt-6">
            <BalanceSheet 
              accounts={accounts} 
              currency={currency}
              asOfDate={format(new Date(dateTo), 'MMMM d, yyyy')}
            />
          </TabsContent>

          <TabsContent value="income-statement" className="mt-6">
            <IncomeStatement 
              journalEntries={journalEntries}
              accounts={accounts}
              currency={currency}
              dateFrom={format(new Date(dateFrom), 'MMM d, yyyy')}
              dateTo={format(new Date(dateTo), 'MMM d, yyyy')}
            />
          </TabsContent>

          <TabsContent value="cash-flow" className="mt-6">
            <Card className="p-6">
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Cash Flow Statement</h3>
                <p className="text-slate-500">Cash flow statement analysis coming soon</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}