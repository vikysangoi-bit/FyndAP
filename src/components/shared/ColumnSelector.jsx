import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Columns3, MoveVertical } from "lucide-react";

export default function ColumnSelector({ columns, visibleColumns, onVisibilityChange }) {
  const [open, setOpen] = useState(false);

  const handleToggle = (columnId) => {
    const newVisible = visibleColumns.includes(columnId)
      ? visibleColumns.filter(id => id !== columnId)
      : [...visibleColumns, columnId];
    onVisibilityChange(newVisible);
  };

  const handleMoveUp = (columnId) => {
    const index = visibleColumns.indexOf(columnId);
    if (index > 0) {
      const newVisible = [...visibleColumns];
      [newVisible[index - 1], newVisible[index]] = [newVisible[index], newVisible[index - 1]];
      onVisibilityChange(newVisible);
    }
  };

  const handleMoveDown = (columnId) => {
    const index = visibleColumns.indexOf(columnId);
    if (index < visibleColumns.length - 1 && index !== -1) {
      const newVisible = [...visibleColumns];
      [newVisible[index], newVisible[index + 1]] = [newVisible[index + 1], newVisible[index]];
      onVisibilityChange(newVisible);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-200">
          <Columns3 className="w-4 h-4 mr-2" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-3">Select Columns</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {columns.map((col) => {
                const isVisible = visibleColumns.includes(col.id);
                const currentIndex = visibleColumns.indexOf(col.id);
                
                return (
                  <div key={col.id} className="flex items-center justify-between gap-2 p-2 hover:bg-slate-50 rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        id={col.id}
                        checked={isVisible}
                        onCheckedChange={() => handleToggle(col.id)}
                      />
                      <Label 
                        htmlFor={col.id} 
                        className="text-sm cursor-pointer flex-1"
                      >
                        {col.header}
                      </Label>
                    </div>
                    {isVisible && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(col.id)}
                          disabled={currentIndex === 0}
                        >
                          <MoveVertical className="w-3 h-3 rotate-180" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(col.id)}
                          disabled={currentIndex === visibleColumns.length - 1}
                        >
                          <MoveVertical className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onVisibilityChange(columns.map(c => c.id));
              }}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}