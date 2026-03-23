import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Package,
  ArrowRightLeft,
  CheckSquare,
  Coins,
  FolderOpen,
  Users,
  ScrollText,
  Menu,
  LogOut,
  ChevronRight,
  Building2,
  BarChart3
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  {
    name: 'Order to Cash',
    icon: ArrowRightLeft,
    children: [
      {
        name: 'Sales Orders',
        children: [
          { name: 'Order Form for Services', page: 'ServiceOrderForm' },
          { name: 'Order Confirmation for Goods', page: 'GoodsOrderConfirmation' },
        ]
      },
      { name: 'Invoices', page: 'Invoices' },
      { name: 'Credit Notes', page: 'CreditNotes' },
      { name: 'Receipts', page: 'Receipts' },
    ]
  },
  {
    name: 'Procure to Pay',
    icon: FileText,
    children: [
      { name: 'Purchase Orders', page: 'PurchaseOrders' },
      { name: 'Goods Receipts (GRN)', page: 'GoodsReceiptNote' },
      { name: 'Convert PO to Bill', page: 'PurchaseBillConversion' },
      { name: 'Vendor Bills', page: 'VendorBills' },
      { name: 'Debit Notes', page: 'DebitNotes' },
      { name: 'Payments', page: 'Payments' },
    ]
  },
  { 
    name: 'Accounting', 
    icon: BookOpen, 
    children: [
      { name: 'Chart of Accounts', page: 'ChartOfAccounts' },
      { name: 'Journal Entries', page: 'JournalEntries' },
    ]
  },
  {
    name: 'Inventory',
    icon: Package,
    children: [
      { name: 'Item Master', page: 'Inventory' },
      { name: 'Goods Receipt Notes', page: 'GoodsReceiptNote' },
      { name: 'Stock Ledger', page: 'StockLedger' },
      { name: 'Transactions', page: 'InventoryTransactions' },
    ]
  },
  { 
    name: 'Reports', 
    icon: BarChart3, 
    children: [
      { name: 'Reports Hub', page: 'Reports' },
      { name: 'Financial Reports', page: 'FinancialReports' },
      { name: 'Inventory Reports', page: 'InventoryReports' },
      { name: 'Purchase Reports', page: 'PurchaseReports' },
      { name: 'Board Reporting', page: 'BoardReporting' },
    ]
  },
  { name: 'Approvals', icon: CheckSquare, page: 'Approvals' },
  { name: 'Currencies', icon: Coins, page: 'Currencies' },
  { name: 'Documents', icon: FolderOpen, page: 'Documents' },
  { 
    name: 'Users & Roles', 
    icon: Users, 
    children: [
      { name: 'Users', page: 'Users' },
      { name: 'Custom Roles', page: 'CustomRoles' },
    ]
  },
  { name: 'Audit Logs', icon: ScrollText, page: 'AuditLogs' },
];

function NavItem({ item, currentPageName, expanded, setExpanded, mobile = false }) {
  const [subExpanded, setSubExpanded] = useState(null);

  const isActive = item.page === currentPageName ||
    item.children?.some(c => c.page === currentPageName || c.children?.some(g => g.page === currentPageName));
  const hasChildren = item.children?.length > 0;
  const isExpanded = expanded === item.name;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(isExpanded ? null : item.name)}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isActive ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
        {isExpanded && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map((child) => {
              if (child.children?.length > 0) {
                const isSubActive = child.children.some(g => g.page === currentPageName);
                const isSubExpanded = subExpanded === child.name;
                return (
                  <div key={child.name}>
                    <button
                      onClick={() => setSubExpanded(isSubExpanded ? null : child.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                        ${isSubActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      <span>{child.name}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${isSubExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isSubExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {child.children.map((grandchild) => (
                          <Link
                            key={grandchild.page}
                            to={createPageUrl(grandchild.page)}
                            className={`block px-3 py-1.5 rounded-lg text-sm transition-all
                              ${grandchild.page === currentPageName
                                ? 'bg-[#1e3a5f] text-white'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                          >
                            {grandchild.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={child.page}
                  to={createPageUrl(child.page)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-all
                    ${child.page === currentPageName
                      ? 'bg-[#1e3a5f] text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={createPageUrl(item.page)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
        ${isActive ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <item.icon className="w-5 h-5" />
      <span>{item.name}</span>
    </Link>
  );
}

function Sidebar({ currentPageName, mobile = false }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d1c12e7412aa1b6e6ab01/10ee209f4_Fyndcreatelogo.png" 
            alt="Fynd Logo" 
            className="h-12 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-900">FinBox</h1>
            <p className="text-xs text-slate-500">Accounting & Inventory</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            currentPageName={currentPageName}
            expanded={expanded}
            setExpanded={setExpanded}
            mobile={mobile}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">© 2024 FinBox</p>
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col bg-white border-r border-slate-200">
        <Sidebar currentPageName={currentPageName} />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar currentPageName={currentPageName} mobile />
            </SheetContent>
          </Sheet>

          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d1c12e7412aa1b6e6ab01/10ee209f4_Fyndcreatelogo.png" 
              alt="Fynd Logo" 
              className="h-8 object-contain"
            />
            <span className="font-bold text-slate-900">FinBox</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-72">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-end px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-[#2d4a6f] to-[#1e3a5f] text-white">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <div className="min-h-[calc(100vh-65px)]">
          {children}
        </div>
      </main>
    </div>
  );
}