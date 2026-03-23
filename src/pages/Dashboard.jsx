import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Card } from "@/components/ui/card";
import { DollarSign, Package, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => base44.entities.SalesOrder.filter({ is_deleted: false })
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.filter({ is_deleted: false })
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => base44.entities.Receipt.filter({ is_deleted: false })
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 100)
  });

  const { data: approvalRequests = [] } = useQuery({
    queryKey: ['approval-requests'],
    queryFn: () => base44.entities.ApprovalRequest.list('-created_date', 20)
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list()
  });

  // Calculate stats with month-over-month comparison
  const stats = React.useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const getExchangeRate = (currencyCode) => {
      return currencies.find(c => c.code === currencyCode)?.exchange_rate || 1;
    };

    // Total Orders
    const currentMonthOrders = salesOrders.filter(o => o.created_date?.startsWith(currentMonth));
    const lastMonthOrders = salesOrders.filter(o => o.created_date?.startsWith(lastMonthStr));
    const totalOrders = currentMonthOrders.reduce((sum, o) => {
      const rate = getExchangeRate(o.currency || 'INR');
      return sum + ((o.orderFormValue || 0) * rate);
    }, 0);
    const lastMonthOrdersValue = lastMonthOrders.reduce((sum, o) => {
      const rate = getExchangeRate(o.currency || 'INR');
      return sum + ((o.orderFormValue || 0) * rate);
    }, 0);
    const ordersChange = lastMonthOrdersValue > 0 ? (((totalOrders - lastMonthOrdersValue) / lastMonthOrdersValue) * 100).toFixed(1) : 0;

    // Total Billed
    const currentMonthInvoices = invoices.filter(i => i.created_date?.startsWith(currentMonth));
    const lastMonthInvoices = invoices.filter(i => i.created_date?.startsWith(lastMonthStr));
    const totalBilled = currentMonthInvoices.reduce((sum, i) => {
      const rate = getExchangeRate(i.invoiceCurrency || 'INR');
      return sum + ((i.invoiceValue || 0) * rate);
    }, 0);
    const lastMonthBilled = lastMonthInvoices.reduce((sum, i) => {
      const rate = getExchangeRate(i.invoiceCurrency || 'INR');
      return sum + ((i.invoiceValue || 0) * rate);
    }, 0);
    const billedChange = lastMonthBilled > 0 ? (((totalBilled - lastMonthBilled) / lastMonthBilled) * 100).toFixed(1) : 0;

    // Total Collections
    const currentMonthReceipts = receipts.filter(r => r.created_date?.startsWith(currentMonth));
    const lastMonthReceipts = receipts.filter(r => r.created_date?.startsWith(lastMonthStr));
    const totalCollections = currentMonthReceipts.reduce((sum, r) => {
      const rate = getExchangeRate(r.receiptCurrency || 'INR');
      return sum + ((r.receiptValue || 0) * rate);
    }, 0);
    const lastMonthCollections = lastMonthReceipts.reduce((sum, r) => {
      const rate = getExchangeRate(r.receiptCurrency || 'INR');
      return sum + ((r.receiptValue || 0) * rate);
    }, 0);
    const collectionsChange = lastMonthCollections > 0 ? (((totalCollections - lastMonthCollections) / lastMonthCollections) * 100).toFixed(1) : 0;

    // Active Clients - accounts with category "current_asset" and type "asset" (Trade Receivables) and active
    const activeClients = accounts.filter(a => 
      a.category === 'current_asset' && 
      a.type === 'asset' && 
      a.active === true
    ).length;

    return {
      totalOrders,
      ordersChange,
      ordersUp: parseFloat(ordersChange) > 0,
      totalBilled,
      billedChange,
      billedUp: parseFloat(billedChange) > 0,
      totalCollections,
      collectionsChange,
      collectionsUp: parseFloat(collectionsChange) > 0,
      activeClients
    };
  }, [salesOrders, invoices, receipts, accounts, currencies]);

  // Chart data - entries by month
  const monthlyData = React.useMemo(() => {
    const months = {};
    journalEntries.forEach(entry => {
      if (entry.entry_date) {
        const month = entry.entry_date.substring(0, 7);
        if (!months[month]) months[month] = { month, debit: 0, credit: 0 };
        months[month].debit += entry.total_debit || 0;
        months[month].credit += entry.total_credit || 0;
      }
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [journalEntries]);

  // Inventory by category
  const inventoryByCategory = React.useMemo(() => {
    const categories = {};
    inventory.forEach(item => {
      const cat = item.category || 'other';
      if (!categories[cat]) categories[cat] = { name: cat, value: 0 };
      categories[cat].value += item.total_value || 0;
    });
    return Object.values(categories);
  }, [inventory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Garment ERP Overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={`₹${stats.totalOrders.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={FileText}
            trend={`${stats.ordersChange}%`}
            trendUp={stats.ordersUp}
          />
          <StatCard
            title="Total Billed"
            value={`₹${stats.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={DollarSign}
            trend={`${stats.billedChange}%`}
            trendUp={stats.billedUp}
          />
          <StatCard
            title="Total Collections"
            value={`₹${stats.totalCollections.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={TrendingUp}
            trend={`${stats.collectionsChange}%`}
            trendUp={stats.collectionsUp}
          />
          <StatCard
            title="Active Clients"
            value={stats.activeClients}
            icon={Package}
            subtitle="Trade Receivables"
          />
        </div>

        {/* Charts & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Transactions Chart */}
          <Card className="lg:col-span-2 p-6 border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Transaction Trends</h3>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }} 
                  />
                  <Area type="monotone" dataKey="debit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDebit)" strokeWidth={2} />
                  <Area type="monotone" dataKey="credit" stroke="#10b981" fillOpacity={1} fill="url(#colorCredit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <QuickActions />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory by Category */}
          <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Inventory by Category</h3>
            <div className="h-64 flex items-center">
              {inventoryByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {inventoryByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center w-full">No inventory data</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {inventoryByCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-slate-600 capitalize">{cat.name.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <RecentActivity items={approvalRequests} />
        </div>
      </div>
    </div>
  );
}