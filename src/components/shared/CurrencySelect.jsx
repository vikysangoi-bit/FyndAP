import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function CurrencySelect({ value, onChange, className = "" }) {
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list()
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.filter(c => c.is_active).map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}