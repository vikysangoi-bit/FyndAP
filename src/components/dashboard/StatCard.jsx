import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <Card className={cn("p-6 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", trendUp ? "text-emerald-600" : "text-rose-600")}>
              <span>{trendUp ? "↑" : "↓"} {trend}</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50">
            <Icon className="w-6 h-6 text-slate-600" />
          </div>
        )}
      </div>
    </Card>
  );
}