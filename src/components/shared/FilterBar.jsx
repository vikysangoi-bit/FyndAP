import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

export default function FilterBar({ 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = "Search...",
  filters = [],
  className = ""
}) {
  const activeFiltersCount = filters.filter(f => f.value && f.value !== 'all').length;

  const clearAllFilters = () => {
    filters.forEach(filter => filter.onChange('all'));
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-10 border-slate-200 focus:border-slate-300 bg-white"
        />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="border-slate-200 bg-white relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-slate-900">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filters</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
            
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-xs font-medium text-slate-600">
                  {filter.placeholder}
                </label>
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue placeholder={`Select ${filter.placeholder.toLowerCase()}`} />
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
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}