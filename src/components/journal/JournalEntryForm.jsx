import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import CurrencySelect from "../shared/CurrencySelect";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function JournalEntryForm({ open, onOpenChange, entry, onSave, isLoading }) {
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    currency: 'USD',
    exchange_rate: 1,
    lines: [
      { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
      { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0, description: '' }
    ]
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.filter({ is_active: true })
  });

  useEffect(() => {
    if (entry) {
      setForm({
        ...entry,
        entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
        lines: entry.lines || [
          { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
          { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0, description: '' }
        ]
      });
    } else {
      setForm({
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        currency: 'USD',
        exchange_rate: 1,
        lines: [
          { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0, description: '' },
          { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0, description: '' }
        ]
      });
    }
  }, [entry, open]);

  const addLine = () => {
    setForm({
      ...form,
      lines: [...form.lines, { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const removeLine = (index) => {
    if (form.lines.length > 2) {
      setForm({
        ...form,
        lines: form.lines.filter((_, i) => i !== index)
      });
    }
  };

  const updateLine = (index, field, value) => {
    const newLines = [...form.lines];
    if (field === 'account_id') {
      const account = accounts.find(a => a.id === value);
      if (account) {
        newLines[index] = {
          ...newLines[index],
          account_id: value,
          account_code: account.code,
          account_name: account.name
        };
      }
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setForm({ ...form, lines: newLines });
  };

  const totalDebit = form.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
  const totalCredit = form.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      total_debit: totalDebit,
      total_credit: totalCredit
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={form.reference || ''}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="INV-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <CurrencySelect 
                value={form.currency} 
                onChange={(v) => setForm({ ...form, currency: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Exchange Rate</Label>
              <Input
                type="number"
                step="0.0001"
                value={form.exchange_rate}
                onChange={(e) => setForm({ ...form, exchange_rate: parseFloat(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter entry description..."
              required
            />
          </div>

          <Card className="p-4 border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-slate-900">Entry Lines</h4>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="w-4 h-4 mr-1" /> Add Line
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-2">
                <div className="col-span-4">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2 text-right">Debit</div>
                <div className="col-span-2 text-right">Credit</div>
                <div className="col-span-1"></div>
              </div>

              {form.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Select value={line.account_id} onValueChange={(v) => updateLine(index, 'account_id', v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      className="h-9"
                      value={line.description || ''}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      placeholder="Line memo"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-9 text-right"
                      type="number"
                      step="0.01"
                      value={line.debit || ''}
                      onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-9 text-right"
                      type="number"
                      step="0.01"
                      value={line.credit || ''}
                      onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => removeLine(index)}
                      disabled={form.lines.length <= 2}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-12 gap-2 pt-4 border-t border-slate-200 font-semibold">
                <div className="col-span-7 text-right text-slate-600">Totals:</div>
                <div className="col-span-2 text-right text-slate-900">{totalDebit.toFixed(2)}</div>
                <div className="col-span-2 text-right text-slate-900">{totalCredit.toFixed(2)}</div>
                <div className="col-span-1"></div>
              </div>

              {!isBalanced && (
                <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Entry is not balanced. Difference: {Math.abs(totalDebit - totalCredit).toFixed(2)}</span>
                </div>
              )}
            </div>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !isBalanced} 
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isLoading ? 'Saving...' : (entry ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}