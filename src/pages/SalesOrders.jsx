import React, { useState } from 'react';
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
import { MoreHorizontal, FileText, Eye, Edit, Trash2, Printer, Mail, RefreshCw } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useEffect } from 'react';

const STORAGE_KEY = 'salesOrders_visibleColumns';

export default function SalesOrders() {
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
  const [serviceFilter, setServiceFilter] = useState('all');
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
      // Fetch customer details from Account
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
      
      // Create approval request for draft orders
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
        details: 'Created sales order'
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
      
      // Fetch customer details if customer code changed
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
          details: 'Updated sales order'
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
          details: 'Deleted sales order'
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rows) => {
      const user = await base44.auth.me();
      await Promise.all(rows.map(row => 
        base44.entities.SalesOrder.update(row.id, {
          is_deleted: true,
          deleted_by: user.email,
          deleted_on: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setSelectedRows([]);
      setShowBulkDeleteConfirm(false);
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
    
    // Auto-mark as expired if past end date
    const now = new Date();
    const endDate = order.endDate ? new Date(order.endDate) : null;
    const isExpired = endDate && endDate < now && order.status === 'active';
    const displayStatus = isExpired ? 'expired' : order.status;
    
    const matchesSearch = 
      order.orderFormNo?.toLowerCase().includes(search.toLowerCase()) ||
      order.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || displayStatus === statusFilter;
    const matchesService = serviceFilter === 'all' || order.serviceName === serviceFilter;
    const matchesClient = clientFilter === 'all' || order.customerName === clientFilter;
    const matchesSalesPerson = salesPersonFilter === 'all' || order.salesPersonName === salesPersonFilter;
    
    const matchesDeliveryMonth = deliveryMonthFilter === 'all' || (() => {
      if (!order.expectedDelivery) return false;
      const deliveryDate = new Date(order.expectedDelivery);
      return `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}` === deliveryMonthFilter;
    })();
    
    const matchesOrderMonth = orderMonthFilter === 'all' || (() => {
      if (!order.startDate) return false;
      const startDate = new Date(order.startDate);
      return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}` === orderMonthFilter;
    })();
    
    return matchesSearch && matchesStatus && matchesService && matchesClient && matchesSalesPerson && matchesDeliveryMonth && matchesOrderMonth;
  });

  const allColumns = [
    { id: 'orderFormNo', header: "Order No", accessor: "orderFormNo", render: (row) => <span className="font-mono font-medium">{row.orderFormNo}</span> },
    { id: 'customerCode', header: "Customer Code", accessor: "customerCode" },
    { id: 'customerName', header: "Customer Name", accessor: "customerName" },
    { id: 'serviceName', header: "Service", accessor: "serviceName" },
    { id: 'orderFormValue', header: "Value", render: (row) => <span className="font-medium">{(row.orderFormValue || 0).toLocaleString('en-US', { style: 'currency', currency: row.currency || 'USD' })}</span> },
    { id: 'salesPersonName', header: "Sales Person", accessor: "salesPersonName" },
    { id: 'expectedDelivery', header: "Expected Delivery", accessor: "expectedDelivery" },
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
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setPrintingOrder(row); setShowPrintView(true); }}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingOrder(row); setViewingOrder(null); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {(row.status === 'approved' || row.status === 'signed' || row.status === 'rejected') && (
              <DropdownMenuItem onClick={() => setShowUpdateStatus(row)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Status
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => sendEmailDraft(row)}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteOrder(row)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedColumns = saved ? JSON.parse(saved) : allColumns.map(c => c.id);
    if (!savedColumns.includes('actions')) {
      savedColumns.push('actions');
    }
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

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRows);
  };

  const sendEmailDraft = async (order) => {
    try {
      const itemsTable = order.gaasLineItems?.map((item, i) => 
        `${i + 1}. ${item.itemName || item.styleID} - ${item.description || ''} - Qty: ${item.quantity} @ ${order.currency || 'USD'} ${item.rate?.toFixed(2)}`
      ).join('\n') || 'No line items';

      const emailBody = `
        <h2>Sales Order: ${order.orderFormNo}</h2>
        <p><strong>Customer:</strong> ${order.customerName} (${order.customerCode})</p>
        <p><strong>Brand:</strong> ${order.customerBrand || 'N/A'}</p>
        <p><strong>Service:</strong> ${order.serviceName}</p>
        <p><strong>Expected Delivery:</strong> ${order.expectedDelivery || 'N/A'}</p>
        <p><strong>Payment Terms:</strong> ${order.paymentTerm || 'N/A'}</p>
        
        ${order.gaasLineItems?.length ? `<h3>Items:</h3><pre>${itemsTable}</pre>` : ''}
        
        <h3>Order Details:</h3>
        <p><strong>Order Value:</strong> ${order.currency || 'USD'} ${(order.orderFormValue || 0).toFixed(2)}</p>
        <p><strong>Order Term:</strong> ${order.orderTerm || 'N/A'}</p>
        <p><strong>Start Date:</strong> ${order.startDate || 'N/A'}</p>
        <p><strong>End Date:</strong> ${order.endDate || 'N/A'}</p>
        
        <p><strong>Contact Person:</strong> ${order.contactPersonName || 'N/A'}</p>
        <p><strong>Email:</strong> ${order.contactPersonEmail || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.contactPersonPhone || 'N/A'}</p>
        
        ${order.specialTerms ? `<p><strong>Special Terms:</strong> ${order.specialTerms}</p>` : ''}
        
        <p>Best regards,</p>
      `.trim();

      const result = await base44.functions.invoke('createGmailDraft', {
        to: order.contactPersonEmail || '',
        subject: `Sales Order ${order.orderFormNo} - ${order.customerName}`,
        body: emailBody,
        pdfUrl: 'https://placeholder.com/dummy.pdf'
      });

      alert('Gmail draft created successfully! Please check your Gmail drafts.');
    } catch (error) {
      console.error('Error creating draft:', error);
      alert(`Error creating draft: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Sales Orders" 
          subtitle="Manage customer sales orders"
          onAdd={() => { setEditingOrder(null); setViewingOrder(null); setShowForm(true); }}
          addLabel="New Sales Order"
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
              const headers = ['orderFormNo', 'customerCode', 'customerName', 'orderFormValue', 'status'];
              const rows = filteredOrders.map(o => [o.orderFormNo, o.customerCode, o.customerName, o.orderFormValue, o.status]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sales_orders_${new Date().toISOString().split('T')[0]}.csv`;
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-900">{orders.length}</span> Total</div>
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">{filteredOrders.length}</span> Filtered</div>
              {selectedRows.length > 0 && (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <div><span className="font-semibold text-blue-600">{selectedRows.length}</span> Selected</div>
                </>
              )}
              <div className="h-4 w-px bg-slate-200" />
              <div><span className="font-semibold text-slate-900">₹{totalValue.toFixed(2)}</span> Total Value</div>
            </div>
          </div>

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by order no, customer..."
            filters={[
              {
                key: 'service',
                value: serviceFilter,
                onChange: setServiceFilter,
                placeholder: 'Service',
                options: [
                  { value: 'DaaS', label: 'DaaS' },
                  { value: 'GaaS', label: 'GaaS' },
                  { value: 'AI Photoshoot', label: 'AI Photoshoot' }
                ]
              },
              {
                key: 'client',
                value: clientFilter,
                onChange: setClientFilter,
                placeholder: 'Client',
                options: [...new Set(orders.map(o => o.customerName).filter(Boolean))].map(name => ({
                  value: name,
                  label: name
                }))
              },
              {
                key: 'salesPerson',
                value: salesPersonFilter,
                onChange: setSalesPersonFilter,
                placeholder: 'Sales Person',
                options: [...new Set(orders.map(o => o.salesPersonName).filter(Boolean))].map(name => ({
                  value: name,
                  label: name
                }))
              },
              {
                key: 'deliveryMonth',
                value: deliveryMonthFilter,
                onChange: setDeliveryMonthFilter,
                placeholder: 'Delivery Month',
                options: [...new Set(orders.map(o => {
                  if (!o.expectedDelivery) return null;
                  const date = new Date(o.expectedDelivery);
                  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }).filter(Boolean))].sort().reverse().map(month => {
                  const [year, m] = month.split('-');
                  const monthName = new Date(year, parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return { value: month, label: monthName };
                })
              },
              {
                key: 'orderMonth',
                value: orderMonthFilter,
                onChange: setOrderMonthFilter,
                placeholder: 'Order Month',
                options: [...new Set(orders.map(o => {
                  if (!o.startDate) return null;
                  const date = new Date(o.startDate);
                  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }).filter(Boolean))].sort().reverse().map(month => {
                  const [year, m] = month.split('-');
                  const monthName = new Date(year, parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return { value: month, label: monthName };
                })
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
                  { value: 'cancelled', label: 'Cancelled' }
                ]
              }
            ]}
          />
        </div>

        {!isLoading && orders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No sales orders yet"
            description="Create your first sales order to get started."
            actionLabel="Create Sales Order"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DataTable 
            columns={allColumns} 
            data={filteredOrders} 
            isLoading={isLoading}
            emptyMessage="No sales orders match your search"
            visibleColumns={visibleColumns}
            enableRowSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
        )}

        <SalesOrderForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setViewingOrder(null);
              setEditingOrder(null);
            }
          }}
          order={viewingOrder || editingOrder}
          accounts={accounts}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          viewMode={!!viewingOrder}
        />

        <SalesOrderPrintView
          open={showPrintView}
          onOpenChange={(open) => {
            setShowPrintView(open);
            if (!open) setPrintingOrder(null);
          }}
          order={printingOrder}
        />

        <ConfirmDialog
          open={!!deleteOrder}
          onOpenChange={() => setDeleteOrder(null)}
          title="Delete Sales Order"
          description={`Are you sure you want to delete order "${deleteOrder?.orderFormNo}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteOrder.id)}
          variant="destructive"
        />

        <ConfirmDialog
          open={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          title="Delete Selected Sales Orders"
          description={`Are you sure you want to delete ${selectedRows.length} selected sales order(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
          variant="destructive"
        />

        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          entityName="SalesOrder"
          schema={{
            type: "array",
            items: {
              type: "object",
              properties: {
                orderFormNo: { type: "string" },
                customerCode: { type: "string" },
                orderFormValue: { type: "number" },
                paymentTerm: { type: "string", enum: ["full_advance", "net_7", "net_30", "net_45", "net_60", "net_90"] },
                paymentTermFrom: { type: "string" },
                expectedDelivery: { type: "string" },
                orderTerm: { type: "string", enum: ["1_year", "2_years", "3_years", "5_years"] },
                startDate: { type: "string" },
                endDate: { type: "string" },
                autoRenewal: { type: "string", enum: ["Yes", "No"] },
                leadSource: { type: "string", enum: ["Direct", "Indirect"] },
                partnerName: { type: "string" },
                salesPersonName: { type: "string" },
                contactPersonName: { type: "string" },
                contactPersonEmail: { type: "string" },
                contactPersonPhone: { type: "string" },
                serviceName: { type: "string", enum: ["DaaS", "GaaS", "Snap"] },
                uom: { type: "string", enum: ["SKU", "Tech_pack", "Qty"] },
                inclusions: { type: "string" },
                unitPrice: { type: "number" },
                billingFrequency: { type: "string", enum: ["One_Time", "ARR", "MRR"] },
                specialTerms: { type: "string" }
              },
              required: ["orderFormNo", "customerCode"]
            }
          }}
          templateData={[
            'orderFormNo,customerCode,orderFormValue,paymentTerm,expectedDelivery,orderTerm,startDate,endDate,autoRenewal,leadSource,salesPersonName,contactPersonName,contactPersonEmail,contactPersonPhone,serviceName,uom,unitPrice,billingFrequency',
            'SO-2024-001,1000,50000,net_30,2024-03-01,1_year,2024-01-01,2024-12-31,No,Direct,John Sales,Jane Contact,jane@example.com,+1234567890,DaaS,SKU,100,ARR'
          ]}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['sales-orders'] })}
        />

        <UpdateStatusDialog
          open={!!showUpdateStatus}
          onOpenChange={() => setShowUpdateStatus(null)}
          order={showUpdateStatus}
          onUpdate={({ status, reason }) => updateStatusMutation.mutate({ 
            id: showUpdateStatus.id, 
            status, 
            reason 
          })}
          isLoading={updateStatusMutation.isPending}
        />
      </div>
    </div>
  );
}