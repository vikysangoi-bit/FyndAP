import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import InventoryItemForm from "@/components/inventory/InventoryItemForm";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import BulkDeleteDialog from "@/components/shared/BulkDeleteDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Package, AlertTriangle, TrendingDown } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const STORAGE_KEY = 'inventory_visibleColumns';

const ITEM_TYPE_LABELS = {
  raw_material: 'Raw Material',
  finished_goods: 'Finished Goods',
  semi_finished: 'Semi-Finished',
  consumable: 'Consumable',
  trading: 'Trading',
  service: 'Service',
};

const ITEM_TYPE_COLORS = {
  raw_material: 'bg-blue-50 text-blue-700 border-blue-200',
  finished_goods: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  semi_finished: 'bg-purple-50 text-purple-700 border-purple-200',
  consumable: 'bg-amber-50 text-amber-700 border-amber-200',
  trading: 'bg-sky-50 text-sky-700 border-sky-200',
  service: 'bg-slate-100 text-slate-700 border-slate-200',
};

const VALUATION_SHORT = {
  weighted_average: 'AVCO',
  fifo: 'FIFO',
  standard_cost: 'STD',
};

export default function Inventory() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setShowForm(false);
      setEditingItem(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setDeleteItem(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      await Promise.all(rows.map(row => base44.entities.InventoryItem.delete(row.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
    }
  });

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.styleID?.toLowerCase().includes(search.toLowerCase()) ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      item.articleNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.ean?.toLowerCase().includes(search.toLowerCase()) ||
      item.hsnCode?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesItemType = itemTypeFilter === 'all' || item.item_type === itemTypeFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && (item.quantity_on_hand || 0) <= (item.reorder_level || 0) && (item.quantity_on_hand || 0) > 0) ||
      (stockFilter === 'out' && (item.quantity_on_hand || 0) === 0) ||
      (stockFilter === 'ok' && (item.quantity_on_hand || 0) > (item.reorder_level || 0));
    return matchesSearch && matchesCategory && matchesItemType && matchesStock;
  });

  // Use average_cost for valuation; fall back to purchase_price then mrp
  const effectiveCost = (item) => item.average_cost || item.purchase_price || item.mrp || 0;

  const allColumns = [
    {
      id: "sku",
      header: "SKU",
      render: (row) => <span className="font-mono font-medium text-slate-900 text-xs">{row.sku}</span>
    },
    {
      id: "name",
      header: "Item Name",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          {row.sub_category && <p className="text-xs text-slate-400">{row.sub_category}</p>}
        </div>
      )
    },
    {
      id: "item_type",
      header: "Type",
      render: (row) => row.item_type ? (
        <Badge variant="outline" className={`text-xs ${ITEM_TYPE_COLORS[row.item_type] || ''}`}>
          {ITEM_TYPE_LABELS[row.item_type] || row.item_type}
        </Badge>
      ) : <span className="text-slate-400">—</span>
    },
    {
      id: "category",
      header: "Category",
      render: (row) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.category?.replace(/_/g, ' ')}
        </Badge>
      )
    },
    {
      id: "hsnCode",
      header: "HSN / SAC",
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.hsnCode || '—'}</span>
    },
    {
      id: "quantity",
      header: "Stock",
      render: (row) => {
        const qty = row.quantity_on_hand || 0;
        const reorder = row.reorder_level || 0;
        const isOut = qty === 0;
        const isLow = !isOut && qty <= reorder;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium tabular-nums ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
              {qty.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">{row.unit}</span>
            </span>
            {isOut && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          </div>
        );
      }
    },
    {
      id: "purchase_price",
      header: "Cost Price",
      render: (row) => (
        <span className="text-slate-700 tabular-nums">
          {row.purchase_price ? `₹${Number(row.purchase_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      )
    },
    {
      id: "average_cost",
      header: "Avg Cost",
      render: (row) => (
        <div>
          <span className="text-slate-700 tabular-nums">
            {row.average_cost ? `₹${Number(row.average_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          </span>
          {row.valuation_method && (
            <p className="text-xs text-slate-400">{VALUATION_SHORT[row.valuation_method] || ''}</p>
          )}
        </div>
      )
    },
    {
      id: "tax_rate",
      header: "GST %",
      render: (row) => (
        <span className="text-slate-600 tabular-nums">
          {row.tax_rate != null ? `${row.tax_rate}%` : '—'}
        </span>
      )
    },
    {
      id: "mrp",
      header: "MRP",
      render: (row) => (
        <span className="text-slate-600 tabular-nums">
          {row.mrp ? `₹${Number(row.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      )
    },
    {
      id: "total_value",
      header: "Stock Value",
      render: (row) => {
        const val = (row.quantity_on_hand || 0) * effectiveCost(row);
        return (
          <span className="font-medium text-slate-900 tabular-nums">
            ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      id: "reorder",
      header: "Reorder",
      render: (row) => (
        <span className="text-slate-500 tabular-nums text-xs">
          {row.reorder_level || 0} {row.unit}
        </span>
      )
    },
    {
      id: "lead_time",
      header: "Lead Time",
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {row.lead_time_days ? `${row.lead_time_days}d` : '—'}
        </span>
      )
    },
    {
      id: "location",
      header: "Location",
      render: (row) => <span className="text-slate-500 text-xs">{row.warehouse_location || '—'}</span>
    },
    {
      id: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.is_active === false ? 'inactive' : 'active'} />
      )
    },
    {
      id: "actions",
      header: "",
      cellClassName: "text-right",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditingItem(row); setShowForm(true); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteItem(row)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const defaultVisibleColumns = ['sku', 'name', 'item_type', 'category', 'quantity', 'purchase_price', 'average_cost', 'tax_rate', 'total_value', 'location', 'status', 'actions'];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedColumns = saved ? JSON.parse(saved) : defaultVisibleColumns;
    if (!savedColumns.includes('actions')) savedColumns.push('actions');
    return savedColumns;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Summary stats
  const totalStockValue = filteredItems.reduce((sum, item) => sum + (item.quantity_on_hand || 0) * effectiveCost(item), 0);
  const lowStockCount = items.filter(i => (i.quantity_on_hand || 0) <= (i.reorder_level || 0) && (i.quantity_on_hand || 0) > 0).length;
  const outOfStockCount = items.filter(i => (i.quantity_on_hand || 0) === 0).length;

  const handleSave = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Item Master"
          subtitle="Manage inventory items, costs, and procurement settings"
          onAdd={() => { setEditingItem(null); setShowForm(true); }}
          addLabel="New Item"
        >
          <ColumnSelector
            columns={allColumns.filter(c => c.id !== 'actions')}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          <SyncDropdown
            onBulkUpload={() => setShowBulkUpload(true)}
            onBulkDelete={() => setShowBulkDelete(true)}
            onExportToExcel={() => {
              const headers = [
                'SKU', 'Name', 'Item Type', 'Category', 'Sub Category', 'Unit',
                'HSN Code', 'Purchase Price', 'MRP', 'GST Rate %',
                'Valuation Method', 'Average Cost',
                'Qty on Hand', 'Reorder Level', 'Min Order Qty', 'Lead Time Days',
                'Warehouse Location', 'Supplier',
                'Style ID', 'Article No', 'EAN',
                'Color', 'Size', 'GSM', 'Composition',
                'Is Active', 'Notes'
              ];
              const rows = filteredItems.map(i => [
                i.sku, i.name, i.item_type || '', i.category, i.sub_category || '', i.unit,
                i.hsnCode || '', i.purchase_price || 0, i.mrp || 0, i.tax_rate ?? '',
                i.valuation_method || 'weighted_average', i.average_cost || 0,
                i.quantity_on_hand || 0, i.reorder_level || 0, i.minimum_order_qty || 1, i.lead_time_days || 7,
                i.warehouse_location || '', i.supplier || '',
                i.styleID || '', i.articleNo || '', i.ean || '',
                i.color || '', i.size || '', i.gsm || '', i.composition || '',
                i.is_active !== false ? 'Yes' : 'No', i.notes || ''
              ]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `item_master_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
          />
          {selectedRows.length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedRows.length})
            </Button>
          )}
        </PageHeader>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Items</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Stock Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(totalStockValue / 100000).toFixed(1)}L
            </p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-600 uppercase tracking-wide">Low Stock</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{lowStockCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs text-rose-600 uppercase tracking-wide">Out of Stock</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{outOfStockCount}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-900">{items.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredItems.length}</span> Filtered</div>
              {selectedRows.length > 0 && (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <div><span className="font-semibold text-blue-600">{selectedRows.length}</span> Selected</div>
                </>
              )}
            </div>
          </div>

          <SearchFilter
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by SKU, name, HSN, article no, EAN..."
            filters={[
              {
                key: 'category',
                value: categoryFilter,
                onChange: setCategoryFilter,
                placeholder: 'Category',
                options: [
                  { value: 'fabric', label: 'Fabric' },
                  { value: 'trims', label: 'Trims' },
                  { value: 'accessories', label: 'Accessories' },
                  { value: 'packaging', label: 'Packaging' },
                  { value: 'garments', label: 'Garments' },
                  { value: 'samples', label: 'Samples' },
                  { value: 'electronics', label: 'Electronics' },
                  { value: 'stationery', label: 'Stationery' },
                  { value: 'other', label: 'Other' },
                ]
              },
              {
                key: 'item_type',
                value: itemTypeFilter,
                onChange: setItemTypeFilter,
                placeholder: 'Item Type',
                options: [
                  { value: 'raw_material', label: 'Raw Material' },
                  { value: 'finished_goods', label: 'Finished Goods' },
                  { value: 'semi_finished', label: 'Semi-Finished' },
                  { value: 'consumable', label: 'Consumable' },
                  { value: 'trading', label: 'Trading' },
                  { value: 'service', label: 'Service' },
                ]
              },
              {
                key: 'stock',
                value: stockFilter,
                onChange: setStockFilter,
                placeholder: 'Stock Status',
                options: [
                  { value: 'ok', label: 'In Stock' },
                  { value: 'low', label: 'Low Stock' },
                  { value: 'out', label: 'Out of Stock' },
                ]
              }
            ]}
          />
        </div>

        {!isLoading && items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory items"
            description="Add your first item to start tracking stock, costs, and procurement settings."
            actionLabel="Add Item"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable
            columns={allColumns}
            visibleColumns={visibleColumns}
            data={filteredItems}
            isLoading={isLoading}
            emptyMessage="No items match your filters"
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <InventoryItemForm
          open={showForm}
          onOpenChange={setShowForm}
          item={editingItem}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <ConfirmDialog
          open={!!deleteItem}
          onOpenChange={() => setDeleteItem(null)}
          title="Delete Inventory Item"
          description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteItem.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Items"
          description={`Are you sure you want to delete ${selectedRows.length} selected item(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="InventoryItem"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                sku: { type: "string" },
                name: { type: "string" },
                item_type: { type: "string", enum: ["raw_material", "finished_goods", "semi_finished", "consumable", "trading", "service"] },
                category: { type: "string", enum: ["fabric", "trims", "accessories", "packaging", "garments", "samples", "electronics", "stationery", "other"] },
                sub_category: { type: "string" },
                unit: { type: "string" },
                hsnCode: { type: "string" },
                purchase_price: { type: "number" },
                mrp: { type: "number" },
                tax_rate: { type: "number" },
                valuation_method: { type: "string", enum: ["weighted_average", "fifo", "standard_cost"] },
                quantity_on_hand: { type: "number" },
                reorder_level: { type: "number" },
                minimum_order_qty: { type: "number" },
                lead_time_days: { type: "number" },
                warehouse_location: { type: "string" },
                supplier: { type: "string" },
              },
              required: ["sku", "name", "category", "unit"]
            }
          }}
          templateData={[
            'sku,name,item_type,category,sub_category,unit,hsnCode,purchase_price,mrp,tax_rate,valuation_method,quantity_on_hand,reorder_level,minimum_order_qty,lead_time_days,warehouse_location,supplier',
            'FAB-COT-001,Cotton Twill 58" 180GSM,raw_material,fabric,Cotton,meters,5208,520,620,5,weighted_average,1000,200,100,14,A-1-1,ABC Fabrics',
            'TRM-BTN-001,Plastic Buttons 15mm,raw_material,trims,,pieces,9606,1.50,2.00,12,weighted_average,15000,2000,500,7,B-3-2,XYZ Trims',
            'GAR-TSH-001,T-Shirt Basic White M,finished_goods,garments,,pieces,6109,180,499,12,weighted_average,850,100,50,0,C-1-1,',
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['inventory-items'] })}
        />

        <BulkDeleteDialog
          open={showBulkDelete}
          onOpenChange={setShowBulkDelete}
          entityName="InventoryItem"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['inventory-items'] })}
        />
      </div>
    </div>
  );
}
