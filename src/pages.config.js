/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Approvals from './pages/Approvals';
import AuditLogs from './pages/AuditLogs';
import BoardReporting from './pages/BoardReporting';
import ChartOfAccounts from './pages/ChartOfAccounts';
import CreditNotes from './pages/CreditNotes';
import Currencies from './pages/Currencies';
import CustomRoles from './pages/CustomRoles';
import Dashboard from './pages/Dashboard';
import DebitNotes from './pages/DebitNotes';
import Documents from './pages/Documents';
import FinancialReports from './pages/FinancialReports';
import GoodsOrderConfirmation from './pages/GoodsOrderConfirmation';
import GoodsReceipts from './pages/GoodsReceipts';
import Inventory from './pages/Inventory';
import InventoryReports from './pages/InventoryReports';
import InventoryTransactions from './pages/InventoryTransactions';
import Invoices from './pages/Invoices';
import JournalEntries from './pages/JournalEntries';
import Payments from './pages/Payments';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseReports from './pages/PurchaseReports';
import Receipts from './pages/Receipts';
import Reports from './pages/Reports';
import SalesOrders from './pages/SalesOrders';
import ServiceOrderForm from './pages/ServiceOrderForm';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import VendorBills from './pages/VendorBills';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Approvals": Approvals,
    "AuditLogs": AuditLogs,
    "BoardReporting": BoardReporting,
    "ChartOfAccounts": ChartOfAccounts,
    "CreditNotes": CreditNotes,
    "Currencies": Currencies,
    "CustomRoles": CustomRoles,
    "Dashboard": Dashboard,
    "DebitNotes": DebitNotes,
    "Documents": Documents,
    "FinancialReports": FinancialReports,
    "GoodsOrderConfirmation": GoodsOrderConfirmation,
    "GoodsReceipts": GoodsReceipts,
    "Inventory": Inventory,
    "InventoryReports": InventoryReports,
    "InventoryTransactions": InventoryTransactions,
    "Invoices": Invoices,
    "JournalEntries": JournalEntries,
    "Payments": Payments,
    "PurchaseOrders": PurchaseOrders,
    "PurchaseReports": PurchaseReports,
    "Receipts": Receipts,
    "Reports": Reports,
    "SalesOrders": SalesOrders,
    "ServiceOrderForm": ServiceOrderForm,
    "Suppliers": Suppliers,
    "Users": Users,
    "VendorBills": VendorBills,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};