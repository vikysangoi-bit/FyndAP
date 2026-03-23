import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export default function SearchFilter({ 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = "Search...",
  filters = [],
  className = ""
}) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-10 border-slate-200 focus:border-slate-300 bg-white"
        />
      </div>
      {filters.map((filter) => (
        <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-full sm:w-44 border-slate-200 bg-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.placeholder}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}