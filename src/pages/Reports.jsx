import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  FileText,
  DollarSign,
  ShoppingCart,
  ArrowRight
} from "lucide-react";

const reportCategories = [
  {
    title: "Financial Reports",
    description: "Balance Sheet, Income Statement, Cash Flow analysis",
    icon: DollarSign,
    color: "bg-blue-500",
    page: "FinancialReports",
    reports: ["Balance Sheet", "Income Statement", "Cash Flow Statement"]
  },
  {
    title: "Inventory Reports",
    description: "Turnover, aging, stock valuation analytics",
    icon: Package,
    color: "bg-emerald-500",
    page: "InventoryReports",
    reports: ["Inventory Turnover", "Inventory Aging", "Stock Valuation"]
  },
  {
    title: "Purchase Reports",
    description: "PO variance, supplier performance, procurement insights",
    icon: ShoppingCart,
    color: "bg-purple-500",
    page: "PurchaseReports",
    reports: ["PO vs Received Variance", "Supplier Performance", "Purchase Analytics"]
  },
  {
    title: "Custom Reports",
    description: "Build and save your own custom reports",
    icon: BarChart3,
    color: "bg-amber-500",
    page: "ReportBuilder",
    reports: ["Create Custom Report", "Saved Reports", "Schedule Reports"]
  }
];

export default function Reports() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader 
          title="Reports & Analytics" 
          subtitle="Comprehensive business intelligence and reporting"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="p-6 hover:shadow-lg transition-all border-0 bg-white/80 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${category.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{category.title}</h3>
                    <p className="text-slate-600 mb-4">{category.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {category.reports.map((report) => (
                        <div key={report} className="flex items-center gap-2 text-sm text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>{report}</span>
                        </div>
                      ))}
                    </div>

                    <Link to={createPageUrl(category.page)}>
                      <Button className="w-full bg-slate-900 hover:bg-slate-800">
                        View Reports
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm mb-1">Reports Generated</p>
                <p className="text-2xl font-bold">234</p>
              </div>
              <FileText className="w-8 h-8 text-blue-200" />
            </div>
          </Card>

          <Card className="p-4 border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm mb-1">Saved Reports</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-200" />
            </div>
          </Card>

          <Card className="p-4 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm mb-1">Scheduled Reports</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-200" />
            </div>
          </Card>

          <Card className="p-4 border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm mb-1">Export Downloads</p>
                <p className="text-2xl font-bold">87</p>
              </div>
              <Package className="w-8 h-8 text-amber-200" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}