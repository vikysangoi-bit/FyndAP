import React from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BalanceSheet({ accounts, currency = 'USD', asOfDate }) {
  const assets = accounts.filter(a => a.type === 'asset');
  const liabilities = accounts.filter(a => a.type === 'liability');
  const equity = accounts.filter(a => a.type === 'equity');

  const totalAssets = assets.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const totalEquity = equity.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const AccountGroup = ({ title, accounts, total }) => (
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
        <h2 className="text-2xl font-bold text-slate-900">Balance Sheet</h2>
        <p className="text-slate-500">As of {asOfDate}</p>
      </div>

      <AccountGroup title="Assets" accounts={assets} total={totalAssets} />
      <AccountGroup title="Liabilities" accounts={liabilities} total={totalLiabilities} />
      <AccountGroup title="Equity" accounts={equity} total={totalEquity} />

      <div className="flex justify-between py-3 px-4 bg-blue-50 font-bold border-t-4 border-blue-500 mt-4">
        <span>Total Liabilities & Equity</span>
        <span>{currency} {(totalLiabilities + totalEquity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
    </Card>
  );
}