import React from 'react';
import { Card } from "@/components/ui/card";

export default function IncomeStatement({ journalEntries, accounts, currency = 'USD', dateFrom, dateTo }) {
  const revenue = accounts.filter(a => a.type === 'revenue');
  const expenses = accounts.filter(a => a.type === 'expense');

  const totalRevenue = revenue.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const totalExpenses = expenses.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  const AccountGroup = ({ title, accounts, total, isRevenue = false }) => (
    <div className="mb-6">
      <h3 className="font-bold text-lg mb-2 text-slate-900">{title}</h3>
      {accounts.map((account) => (
        <div key={account.id} className="flex justify-between py-2 px-4 hover:bg-slate-50">
          <span className="text-slate-700">{account.name}</span>
          <span className="font-medium">{currency} {(account.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
      <div className="flex justify-between py-2 px-4 bg-slate-100 font-bold border-t-2 border-slate-300 mt-2">
        <span>Total {title}</span>
        <span>{currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Income Statement</h2>
        <p className="text-slate-500">{dateFrom} to {dateTo}</p>
      </div>

      <AccountGroup title="Revenue" accounts={revenue} total={totalRevenue} isRevenue />
      <AccountGroup title="Expenses" accounts={expenses} total={totalExpenses} />

      <div className={`flex justify-between py-3 px-4 font-bold border-t-4 mt-4 ${
        netIncome >= 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'
      }`}>
        <span>Net {netIncome >= 0 ? 'Income' : 'Loss'}</span>
        <span className={netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
          {currency} {Math.abs(netIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </Card>
  );
}