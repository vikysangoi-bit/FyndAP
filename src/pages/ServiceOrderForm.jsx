import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SalesOrderForm from "@/components/salesorders/SalesOrderForm";
import SalesOrderPrintView from "@/components/salesorders/SalesOrderPrintView";
import BulkUploadDialog from "@/components/shared/BulkUploadDialog";
import UpdateStatusDialog from "@/components/salesorders/UpdateStatusDialog";
import SyncDropdown from "@/components/shared/SyncDropdown";
import StatusBadge from "@/components/shared/StatusBadge";
import ColumnSelector from "@/components/shared/ColumnSelector";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Printer, Mail, RefreshCw } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const STORAGE_KEY = 'serviceOrderForm_visibleColumns';
const SERVICE_TYPES = ['DaaS', 'AI Photoshoot'];

export default function ServiceOrderForm() {
  const [showForm, setShowForm] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showUpdateStatus, setShowUpdateStatus] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState('all');
  const [deliveryMonthFilter, setDeliveryMonthFilter] = useState('all');
  const [orderMonthFilter, setOrderMonthFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => base44.entities.SalesOrder.list('-created_date')
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => base44.entities.Currency.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const customer = accounts.find(a => a.code === data.customerCode);
      if (customer) {
        data.customerName = customer.name;
        data.customerBrand = customer.brand;
        data.customerAddress = customer.address;
        data.customerCountry = customer.country;
        data.customerGstId = customer.gstId;
      }
      const user = await base44.auth.me();
      const order = await base44.entities.SalesOrder.create(data);
      if (data.status === 'draft') {
        await base44.entities.ApprovalRequest.create({
          entity_type: 'sales_order',
          entity_id: order.id,
          title: `Sales Order: ${data.orderFormNo}`,
          description: `Customer: ${data.customerName}, Value: ${data.orderFormValue} ${data.currency}`,
          amount: data.orderFormValue,
          currency: data.currency,
          status: 'pending',
          submitted_by: user?.email,
          submitted_by_name: user?.full_name,
          submitted_at: new Date().toISOString()
        });
      }
      await base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'SalesOrder',
        entity_name: data.orderFormNo,
        details: 'Created service order form'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      const customer = accounts.find(a => a.code === data.customerCode);
      if (customer) {
        data.customerName = customer.name;
        data.customerBrand = customer.brand;
        data.customerAddress = customer.address;
        data.customerCountry = customer.country;
        data.customerGstId = customer.gstId;
      }
      if (user.role === 'admin') {
        await base44.entities.SalesOrder.update(id, { ...data, updated_by: user.email });
        await base44.functions.invoke('logAuditEntry', {
          action: 'update',
          entity_type: 'SalesOrder',
          entity_id: id,
          entity_name: data.orderFormNo,
          details: 'Updated service order form'
        });
      } else {
        await base44.entities.ApprovalRequest.create({
          entity_type: 'sales_order_update',
          entity_id: id,
          title: `Update Sales Order: ${data.orderFormNo}`,
          description: `Request to update sales order ${data.orderFormNo}`,
          submitted_by: user.email,
          submitted_by_name: user.full_name,
          submitted_at: new Date().toISOString()
        });
        alert('Update request submitted for admin approval');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setShowForm(false);
      setEditingOrder(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      const order = orders.find(o => o.id === id);
      if (user.role === 'admin') {
        await base44.entities.SalesOrder.update(id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        });
        await base44.functions.invoke('logAuditEntry', {
          action: 'delete',
          entity_type: 'SalesOrder',
          entity_id: id,
          entity_name: order?.orderFormNo,
          details: 'Deleted service order form'
        });
      } else {
        await base44.entities.ApprovalRequest.create({
          entity_type: 'sales_order_delete',
          entity_id: id,
          title: `Delete Sales Order: ${order?.orderFormNo}`,
          description: `Request to delete sales order ${order?.orderFormNo}`,
          submitted_by: user.email,
          submitted_by_name: user.full_name,
          submitted_at: new Date().toISOString()
        });
        alert('Delete request submitted for admin approval');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setDeleteOrder(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      const user = await base44.auth.me();
      await base44.entities.SalesOrder.update(id, {
        status,
        rejection_reason: reason || null,
        updated_by: user?.email
      });
      await base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'SalesOrder',
        entity_id: id,
        entity_name: showUpdateStatus?.orderFormNo,
        details: `Updated status to ${status}${reason ? `: ${reason}` : ''}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setShowUpdateStatus(null);
    },
  });

  const filteredOrders = orders.filter(order => {
    if (order.is_deleted) return false;
    if (!SERVICE_TYPES.includes(order.serviceName)) return false;

    const now = new Date();
    const endDate = order.endDate ? new Date(order.endDate) : null;
    const isExpired = endDate && endDate < now && order.status === 'active';
    const displayStatus = isExpired ? 'expired' : order.status;

    const matchesSearch =
      order.orderFormNo?.toLowerCase().includes(search.toLowerCase()) ||
      order.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || displayStatus === statusFilter;
    const matchesClient = clientFilter === 'all' || order.customerName === clientFilter;
    const matchesSalesPerson = salesPersonFilter === 'all' || order.salesPersonName === salesPersonFilter;

    const matchesDeliveryMonth = deliveryMonthFilter === 'all' || (() => {
      if (!order.expectedDelivery) return false;
      const d = new Date(order.expectedDelivery);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === deliveryMonthFilter;
    })();

    const matchesOrderMonth = orderMonthFilter === 'all' || (() => {
      if (!order.startDate) return false;
      const d = new Date(order.startDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === orderMonthFilter;
    })();

    return matchesSearch && matchesStatus && matchesClient && matchesSalesPerson && matchesDeliveryMonth && matchesOrderMonth;
  });

  const allColumns = [
    { id: 'orderFormNo', header: "Order No", accessor: "orderFormNo", render: (row) => <span className="font-mono font-medium">{row.orderFormNo}</span> },
    { id: 'customerCode', header: "Customer Code", accessor: "customerCode" },
    { id: 'customerName', header: "Customer Name", accessor: "customerName" },
    { id: 'serviceName', header: "Service", accessor: "serviceName" },
    { id: 'orderFormValue', header: "Value", render: (row) => <span className="font-medium">{(row.orderFormValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.currency || 'USD' })}</span> },
    { id: 'salesPersonName', header: "Sales Person", accessor: "salesPersonName" },
    { id: 'startDate', header: "Start Date", accessor: "startDate" },
    { id: 'endDate', header: "End Date", accessor: "endDate" },
    { id: 'status', header: "Status", render: (row) => {
      const now = new Date();
      const endDate = row.endDate ? new Date(row.endDate) : null;
      const isExpired = endDate && endDate < now && row.status === 'active';
      return <StatusBadge status={isExpired ? 'expired' : row.status} />;
    }},
    {
      id: 'actions',
      header: "",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setViewingOrder(row); setShowForm(true); }}>
              <Eye className="w-4 h-4 mr-2" />View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setPrintingOrder(row); setShowPrintView(true); }}>
              <Printer className="w-4 h-4 mr-2" />Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingOrder(row); setViewingOrder(null); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-2" />Edit
            </DropdownMenuItem>
            {(row.status === 'approved' || row.status === 'signed' || row.status === 'rejected') && (
              <DropdownMenuItem onClick={() => setShowUpdateStatus(row)}>
                <RefreshCw className="w-4 h-4 mr-2" />Update Status
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setDeleteOrder(row)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedColumns = saved ? JSON.parse(saved) : allColumns.map(c => c.id);
    if (!savedColumns.includes('actions')) savedColumns.push('actions');
    return savedColumns;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const totalValue = filteredOrders.reduce((sum, order) => {
    const value = order.orderFormValue || 0;
    const rate = currencies.find(c => c.code === (order.currency || 'INR'))?.exchange_rate || 1;
    return sum + (value * rate);
  }, 0);

  const handleSave = (data) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Order Form for Services"
          subtitle="Manage service-type sales orders (DaaS, AI Photoshoot)"
          onAdd={() => { setEditingOrder(null); setViewingOrder(null); setShowForm(true); }}
          addLabel="New Service Order"
        >
          <ColumnSelector
            columns={allColumns.filter(c => c.id !== 'actions')}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          <SyncDropdown
            onBulkUpload={() => setShowBulkUpload(true)}
            onBulkDelete={() => {}}
            onGoogleSheetsImport={() => {}}
            onGoogleSheetsExport={() => {}}
            onExportToExcel={() => {
              const headers = ['orderFormNo', 'customerCode', 'customerName', 'serviceName', 'orderFormValue', 'status'];
              const rows = filteredOrders.map(o => [o.orderFormNo, o.customerCode, o.customerName, o.serviceName, o.orderFormValue, o.status]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `service_orders_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
          />
          {selectedRows.length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedRows.length})
            </Button>
          )}
        </PageHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div><span className="font-semibold text-slate-900">{filteredOrders.length}</span> Orders</div>
            <div className="h-4 w-px bg-slate-200" />
            <div><span className="font-semibold text-slate-900">₹{totalValue.toFixed(2)}</span> Total Value</div>
          </div>

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by order no, customer..."
            filters={[
              {
                key: 'client',
                value: clientFilter,
                onChange: setClientFilter,
                placeholder: 'Client',
                options: [...new Set(filteredOrders.map(o => o.customerName).filter(Boolean))].map(name => ({ value: name, label: name }))
              },
              {
                key: 'salesPerson',
                value: salesPersonFilter,
                onChange: setSalesPersonFilter,
                placeholder: 'Sales Person',
                options: [...new Set(filteredOrders.map(o => o.salesPersonName).filter(Boolean))].map(name => ({ value: name, label: name }))
              },
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: 'Status',
                options: [
                  { value: 'draft', label: 'Draft' },
                  { value: 'pending_approval', label: 'Pending Approval' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'active', label: 'Active' },
                  { value: 'signed', label: 'Signed' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'rejected', label: 'Rejected' },
                ]
              },
            ]}
          />

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              title="No service orders found"
              description="Create a new order form for services to get started."
              onAdd={() => { setEditingOrder(null); setViewingOrder(null); setShowForm(true); }}
              addLabel="New Service Order"
            />
          ) : (
            <DataTable
              data={filteredOrders}
              columns={allColumns.filter(c => visibleColumns.includes(c.id))}
              selectedRows={selectedRows}
              onSelectRows={setSelectedRows}
            />
          )}
        </div>
      </div>

      {showForm && (
        <SalesOrderForm
          open={showForm}
          onOpenChange={setShowForm}
          order={editingOrder}
          viewOrder={viewingOrder}
          onSave={handleSave}
          defaultServiceName="DaaS"
        />
      )}

      {showPrintView && printingOrder && (
        <SalesOrderPrintView
          open={showPrintView}
          onOpenChange={setShowPrintView}
          order={printingOrder}
        />
      )}

      {showBulkUpload && (
        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="SalesOrder"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['sales-orders'] })}
        />
      )}

      {showUpdateStatus && (
        <UpdateStatusDialog
          open={!!showUpdateStatus}
          onOpenChange={() => setShowUpdateStatus(null)}
          order={showUpdateStatus}
          onUpdateStatus={(status, reason) => updateStatusMutation.mutate({ id: showUpdateStatus.id, status, reason })}
        />
      )}

      {deleteOrder && (
        <ConfirmDialog
          open={!!deleteOrder}
          onOpenChange={() => setDeleteOrder(null)}
          title="Delete Order"
          description={`Are you sure you want to delete order ${deleteOrder?.orderFormNo}?`}
          onConfirm={() => deleteMutation.mutate(deleteOrder.id)}
        />
      )}

      {showBulkDeleteConfirm && (
        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Orders"
          description={`Are you sure you want to delete ${selectedRows.length} orders?`}
          onConfirm={() => {
            Promise.all(selectedRows.map(r => deleteMutation.mutateAsync(r.id))).then(() => {
              setSelectedRows([]);
              setShowBulkDeleteConfirm(false);
            });
          }}
        />
      )}
    </div>
  );
}
