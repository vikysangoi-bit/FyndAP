import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Filter } from "lucide-react";
import * as XLSX from 'xlsx';

export default function BoardReporting() {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  const { data: salesOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => base44.entities.SalesOrder.filter({ is_deleted: false })
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.filter({ is_deleted: false })
  });

  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: () => base44.entities.Receipt.filter({ is_deleted: false })
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list()
  });

  // Get unique regions
  const regions = useMemo(() => {
    const regionSet = new Set(accounts.map(a => a.region).filter(Boolean));
    return ['all', ...Array.from(regionSet)];
  }, [accounts]);

  // Aggregate data by brand and service
  const reportData = useMemo(() => {
    if (!salesOrders.length) return [];

    // Filter by region
    let filteredOrders = salesOrders;
    if (selectedRegion !== 'all') {
      const regionCustomers = accounts
        .filter(a => a.region === selectedRegion)
        .map(a => a.code);
      filteredOrders = salesOrders.filter(o => regionCustomers.includes(o.customerCode));
    }

    // Group by brand
    const brandData = {};

    filteredOrders.forEach(order => {
      const brand = order.customerBrand || 'Unassigned';
      const service = order.serviceName || 'Other';
      
      if (!brandData[brand]) {
        brandData[brand] = {
          brand,
          DaaS: { signed: 0, advance: 0, invoiced: 0, received: 0 },
          GaaS: { signed: 0, advance: 0, invoiced: 0, received: 0 },
          'AI Photoshoot': { signed: 0, advance: 0, invoiced: 0, received: 0 },
          SKUs: { signed: 0, advance: 0, invoiced: 0, received: 0 }
        };
      }

      // Initialize service if not exists
      if (!brandData[brand][service]) {
        brandData[brand][service] = { signed: 0, advance: 0, invoiced: 0, received: 0 };
      }

      // Signed Order Value
      const orderValue = order.orderFormValue || 0;
      brandData[brand][service].signed += orderValue;

      // Get related invoices
      const orderInvoices = invoices.filter(inv => inv.salesOrderId === order.id);
      orderInvoices.forEach(inv => {
        // Invoiced/Delivered
        brandData[brand][service].invoiced += (inv.invoiceValue || 0);

        // Received against Invoice
        const invReceipts = receipts.filter(r => r.invoiceId === inv.id);
        invReceipts.forEach(r => {
          brandData[brand][service].received += (r.receiptValue || 0);
        });
      });
    });

    // Calculate totals for each brand
    Object.values(brandData).forEach(brand => {
      brand.total = {
        signed: 0,
        advance: 0,
        invoiced: 0,
        received: 0
      };
      ['DaaS', 'GaaS', 'AI Photoshoot', 'SKUs'].forEach(service => {
        brand.total.signed += brand[service].signed;
        brand.total.advance += brand[service].advance;
        brand.total.invoiced += brand[service].invoiced;
        brand.total.received += brand[service].received;
      });
    });

    // Calculate grand totals
    const grandTotal = {
      brand: 'Total',
      DaaS: { signed: 0, advance: 0, invoiced: 0, received: 0 },
      GaaS: { signed: 0, advance: 0, invoiced: 0, received: 0 },
      'AI Photoshoot': { signed: 0, advance: 0, invoiced: 0, received: 0 },
      SKUs: { signed: 0, advance: 0, invoiced: 0, received: 0 },
      total: { signed: 0, advance: 0, invoiced: 0, received: 0 }
    };

    Object.values(brandData).forEach(brand => {
      ['DaaS', 'GaaS', 'AI Photoshoot', 'SKUs'].forEach(service => {
        grandTotal[service].signed += brand[service].signed;
        grandTotal[service].advance += brand[service].advance;
        grandTotal[service].invoiced += brand[service].invoiced;
        grandTotal[service].received += brand[service].received;
      });
      grandTotal.total.signed += brand.total.signed;
      grandTotal.total.advance += brand.total.advance;
      grandTotal.total.invoiced += brand.total.invoiced;
      grandTotal.total.received += brand.total.received;
    });

    return [...Object.values(brandData).sort((a, b) => a.brand.localeCompare(b.brand)), grandTotal];
  }, [salesOrders, invoices, receipts, accounts, selectedRegion]);

  // Region Summary Report Data
  const regionReportData = useMemo(() => {
    if (!salesOrders.length) return { services: [], total: null };

    const regions = ['India', 'MEA', 'SEA', 'ROW', 'PV Global', 'PV India'];
    const services = ['DaaS', 'GaaS', 'AI Photoshoot'];

    // Initialize data structure
    const serviceData = {};
    services.forEach(service => {
      serviceData[service] = {
        service,
        regions: {}
      };
      regions.forEach(region => {
        serviceData[service].regions[region] = {
          deals: 0,
          signed: 0,
          advance: 0,
          invoiced: 0,
          received: 0
        };
      });
      serviceData[service].total = {
        deals: 0,
        signed: 0,
        advance: 0,
        invoiced: 0,
        received: 0
      };
    });

    // Aggregate data
    salesOrders.forEach(order => {
      const service = order.serviceName;
      if (!services.includes(service)) return;

      // Get region from account
      const account = accounts.find(a => a.code === order.customerCode);
      const region = account?.region;
      if (!region || !regions.includes(region)) return;

      // Count deal and signed value
      serviceData[service].regions[region].deals += 1;
      serviceData[service].regions[region].signed += (order.orderFormValue || 0);

      // Get related invoices
      const orderInvoices = invoices.filter(inv => inv.salesOrderId === order.id);
      orderInvoices.forEach(inv => {
        serviceData[service].regions[region].invoiced += (inv.invoiceValue || 0);

        // Received against Invoice
        const invReceipts = receipts.filter(r => r.invoiceId === inv.id);
        invReceipts.forEach(r => {
          serviceData[service].regions[region].received += (r.receiptValue || 0);
        });
      });
    });

    // Calculate totals for each service
    services.forEach(service => {
      regions.forEach(region => {
        serviceData[service].total.deals += serviceData[service].regions[region].deals;
        serviceData[service].total.signed += serviceData[service].regions[region].signed;
        serviceData[service].total.advance += serviceData[service].regions[region].advance;
        serviceData[service].total.invoiced += serviceData[service].regions[region].invoiced;
        serviceData[service].total.received += serviceData[service].regions[region].received;
      });
    });

    // Calculate grand totals across all services
    const grandTotal = {
      service: 'Total',
      regions: {}
    };
    regions.forEach(region => {
      grandTotal.regions[region] = {
        deals: 0,
        signed: 0,
        advance: 0,
        invoiced: 0,
        received: 0
      };
      services.forEach(service => {
        grandTotal.regions[region].deals += serviceData[service].regions[region].deals;
        grandTotal.regions[region].signed += serviceData[service].regions[region].signed;
        grandTotal.regions[region].advance += serviceData[service].regions[region].advance;
        grandTotal.regions[region].invoiced += serviceData[service].regions[region].invoiced;
        grandTotal.regions[region].received += serviceData[service].regions[region].received;
      });
    });
    grandTotal.total = {
      deals: 0,
      signed: 0,
      advance: 0,
      invoiced: 0,
      received: 0
    };
    regions.forEach(region => {
      grandTotal.total.deals += grandTotal.regions[region].deals;
      grandTotal.total.signed += grandTotal.regions[region].signed;
      grandTotal.total.advance += grandTotal.regions[region].advance;
      grandTotal.total.invoiced += grandTotal.regions[region].invoiced;
      grandTotal.total.received += grandTotal.regions[region].received;
    });

    // Calculate PO % contribution
    const totalSigned = grandTotal.total.signed;
    grandTotal.contribution = {};
    regions.forEach(region => {
      grandTotal.contribution[region] = totalSigned > 0 
        ? ((grandTotal.regions[region].signed / totalSigned) * 100).toFixed(0) + '%'
        : '0%';
    });

    return {
      services: services.map(s => serviceData[s]),
      total: grandTotal
    };
  }, [salesOrders, invoices, receipts, accounts]);

  const handleExport = () => {
    const exportData = reportData.map(row => ({
      'Brand': row.brand,
      'DaaS - Signed Order Value': row.DaaS.signed,
      'DaaS - Advance Received': row.DaaS.advance,
      'DaaS - Invoiced/Delivered': row.DaaS.invoiced,
      'DaaS - Recd. against Invoice': row.DaaS.received,
      'GaaS - Signed Order Value': row.GaaS.signed,
      'GaaS - Advance Received': row.GaaS.advance,
      'GaaS - Invoiced/Delivered': row.GaaS.invoiced,
      'GaaS - Recd. against Invoice': row.GaaS.received,
      'AI Photoshoot - Signed Order Value': row['AI Photoshoot'].signed,
      'AI Photoshoot - Advance Received': row['AI Photoshoot'].advance,
      'AI Photoshoot - Invoiced/Delivered': row['AI Photoshoot'].invoiced,
      'AI Photoshoot - Recd. against Invoice': row['AI Photoshoot'].received,
      'SKUs - Signed Order Value': row.SKUs.signed,
      'SKUs - Advance Received': row.SKUs.advance,
      'SKUs - Invoiced/Delivered': row.SKUs.invoiced,
      'SKUs - Recd. against Invoice': row.SKUs.received,
      'Total - Signed Order Value': row.total.signed,
      'Total - Advance Received': row.total.advance,
      'Total - Invoiced/Delivered': row.total.invoiced,
      'Total - Recd. against Invoice': row.total.received
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Board Report');
    XLSX.writeFile(wb, `board_report_${selectedRegion}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const isLoading = ordersLoading || invoicesLoading || receiptsLoading;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Board Reporting</h1>
            <p className="text-slate-500 mt-1">Executive Performance Reports</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="brand">Brand Level Split</TabsTrigger>
            <TabsTrigger value="region">Region Summary</TabsTrigger>
          </TabsList>

          {/* Brand Level Report */}
          <TabsContent value="brand">
            <div className="flex items-center justify-end gap-3 mb-4">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>
                      {region === 'all' ? 'All Regions' : region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <Card className="p-6">
          <div className="mb-4 text-right text-sm text-slate-500">
            All values in {selectedCurrency}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th rowSpan="2" className="border border-slate-300 p-2 text-left font-semibold sticky left-0 bg-slate-100 z-10">
                    Brand
                  </th>
                  <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold bg-blue-50">
                    DaaS
                  </th>
                  <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold bg-green-50">
                    GaaS
                  </th>
                  <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold bg-purple-50">
                    AI Photoshoot
                  </th>
                  <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold bg-orange-50">
                    SKUs
                  </th>
                  <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold bg-slate-200">
                    Total
                  </th>
                </tr>
                <tr className="bg-slate-100">
                  {/* DaaS */}
                  <th className="border border-slate-300 p-2 text-center text-xs bg-blue-50">Signed Order Value</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-blue-50">Advance Received</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-blue-50">Invoiced / Delivered</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-blue-50">Recd. against Invoice</th>
                  {/* GaaS */}
                  <th className="border border-slate-300 p-2 text-center text-xs bg-green-50">Signed Order Value</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-green-50">Advance Received</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-green-50">Invoiced / Delivered</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-green-50">Recd. against Invoice</th>
                  {/* AI Photoshoot */}
                  <th className="border border-slate-300 p-2 text-center text-xs bg-purple-50">Signed Order Value</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-purple-50">Advance Received</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-purple-50">Invoiced / Delivered</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-purple-50">Recd. against Invoice</th>
                  {/* SKUs */}
                  <th className="border border-slate-300 p-2 text-center text-xs bg-orange-50">Signed Order Value</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-orange-50">Advance Received</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-orange-50">Invoiced / Delivered</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-orange-50">Recd. against Invoice</th>
                  {/* Total */}
                  <th className="border border-slate-300 p-2 text-center text-xs bg-slate-200">Signed Order Value</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-slate-200">Advance Received</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-slate-200">Invoiced / Delivered</th>
                  <th className="border border-slate-300 p-2 text-center text-xs bg-slate-200">Recd. against Invoice</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="21" className="border border-slate-300 p-8 text-center text-slate-500">
                      Loading data...
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan="21" className="border border-slate-300 p-8 text-center text-slate-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr 
                      key={idx} 
                      className={row.brand === 'Total' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}
                    >
                      <td className="border border-slate-300 p-2 sticky left-0 bg-white z-10">
                        {row.brand}
                      </td>
                      {/* DaaS */}
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.DaaS.signed)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.DaaS.advance)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.DaaS.invoiced)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.DaaS.received)}</td>
                      {/* GaaS */}
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.GaaS.signed)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.GaaS.advance)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.GaaS.invoiced)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.GaaS.received)}</td>
                      {/* AI Photoshoot */}
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row['AI Photoshoot'].signed)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row['AI Photoshoot'].advance)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row['AI Photoshoot'].invoiced)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row['AI Photoshoot'].received)}</td>
                      {/* SKUs */}
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.SKUs.signed)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.SKUs.advance)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.SKUs.invoiced)}</td>
                      <td className="border border-slate-300 p-2 text-right">{formatCurrency(row.SKUs.received)}</td>
                      {/* Total */}
                      <td className="border border-slate-300 p-2 text-right bg-slate-50 font-semibold">{formatCurrency(row.total.signed)}</td>
                      <td className="border border-slate-300 p-2 text-right bg-slate-50 font-semibold">{formatCurrency(row.total.advance)}</td>
                      <td className="border border-slate-300 p-2 text-right bg-slate-50 font-semibold">{formatCurrency(row.total.invoiced)}</td>
                      <td className="border border-slate-300 p-2 text-right bg-slate-50 font-semibold">{formatCurrency(row.total.received)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
          </TabsContent>

          {/* Region Summary Report */}
          <TabsContent value="region">
            <div className="flex items-center justify-end gap-3 mb-4">
              <Button onClick={() => {
                const exportData = [];
                regionReportData.services.forEach(service => {
                  ['India', 'MEA', 'SEA', 'ROW', 'PV Global', 'PV India'].forEach((region, idx) => {
                    if (idx === 0) {
                      exportData.push({
                        'Service': service.service,
                        'Metric': 'PO / OF signed',
                        [`${region} - Deals`]: service.regions[region].deals,
                        [`${region} - Value`]: service.regions[region].signed,
                      });
                    } else {
                      Object.keys(exportData[exportData.length - 1]).forEach(key => {
                        if (key.includes(region)) delete exportData[exportData.length - 1][key];
                      });
                      exportData[exportData.length - 1][`${region} - Deals`] = service.regions[region].deals;
                      exportData[exportData.length - 1][`${region} - Value`] = service.regions[region].signed;
                    }
                  });
                });
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Region Summary');
                XLSX.writeFile(wb, `region_summary_${new Date().toISOString().split('T')[0]}.xlsx`);
              }} variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 p-2 text-left font-semibold" rowSpan="2">
                        1st Apr to 13th Feb
                      </th>
                      <th colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">India</th>
                      <th colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">MEA</th>
                      <th colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">SEA</th>
                      <th colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">ROW</th>
                      <th colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">PV Global</th>
                      <th colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">PV India</th>
                      <th colSpan="2" className="border border-slate-300 p-2 text-center font-semibold bg-slate-200">Total</th>
                    </tr>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 p-2 text-center text-xs">No of deals</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">Value in INR</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">No of deals</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">Value in USD</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">No of deals</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">Value in USD</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">No of deals</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">Value in USD</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">No of deals</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">Value in USD</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">No of deals</th>
                      <th className="border border-slate-300 p-2 text-center text-xs">Value in INR</th>
                      <th className="border border-slate-300 p-2 text-center text-xs bg-slate-200">No of deals</th>
                      <th className="border border-slate-300 p-2 text-center text-xs bg-slate-200">Value in INR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="15" className="border border-slate-300 p-8 text-center text-slate-500">
                          Loading data...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {regionReportData.services.map((service, idx) => (
                          <React.Fragment key={service.service}>
                            <tr className="bg-blue-50 font-semibold">
                              <td colSpan="15" className="border border-slate-300 p-2">{service.service}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 pl-4">PO / OF signed</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.India.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.India.signed ? `₹${formatCurrency(service.regions.India.signed / 100000)} Cr` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.MEA.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.MEA.signed ? `$${formatCurrency(service.regions.MEA.signed / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.SEA.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.SEA.signed ? `$${formatCurrency(service.regions.SEA.signed / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.ROW.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.ROW.signed ? `$${formatCurrency(service.regions.ROW.signed / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions['PV Global'].deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions['PV Global'].signed ? `$${formatCurrency(service.regions['PV Global'].signed / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions['PV India'].deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions['PV India'].signed ? `₹${formatCurrency(service.regions['PV India'].signed / 100000)} Cr` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center bg-slate-100 font-semibold">{service.total.deals}</td>
                              <td className="border border-slate-300 p-2 text-right bg-slate-100 font-semibold">{service.total.signed ? `₹${formatCurrency(service.total.signed / 100000)} Cr` : '-'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 pl-4">Advance received</td>
                              <td className="border border-slate-300 p-2 text-center">-</td>
                              <td className="border border-slate-300 p-2 text-right">-</td>
                              <td className="border border-slate-300 p-2 text-center">-</td>
                              <td className="border border-slate-300 p-2 text-right">-</td>
                              <td className="border border-slate-300 p-2 text-center">-</td>
                              <td className="border border-slate-300 p-2 text-right">-</td>
                              <td className="border border-slate-300 p-2 text-center">-</td>
                              <td className="border border-slate-300 p-2 text-right">-</td>
                              <td className="border border-slate-300 p-2 text-center">-</td>
                              <td className="border border-slate-300 p-2 text-right">-</td>
                              <td className="border border-slate-300 p-2 text-center">-</td>
                              <td className="border border-slate-300 p-2 text-right">-</td>
                              <td className="border border-slate-300 p-2 text-center bg-slate-100">-</td>
                              <td className="border border-slate-300 p-2 text-right bg-slate-100">-</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 pl-4">Invoiced / Delivered</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.India.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.India.invoiced ? `₹${formatCurrency(service.regions.India.invoiced / 100000)} Cr` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.MEA.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.MEA.invoiced ? `$${formatCurrency(service.regions.MEA.invoiced / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.SEA.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.SEA.invoiced ? `$${formatCurrency(service.regions.SEA.invoiced / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.ROW.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.ROW.invoiced ? `$${formatCurrency(service.regions.ROW.invoiced / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions['PV Global'].deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions['PV Global'].invoiced ? `$${formatCurrency(service.regions['PV Global'].invoiced / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions['PV India'].deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions['PV India'].invoiced ? `₹${formatCurrency(service.regions['PV India'].invoiced / 100000)} Cr` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center bg-slate-100 font-semibold">{service.total.deals}</td>
                              <td className="border border-slate-300 p-2 text-right bg-slate-100 font-semibold">{service.total.invoiced ? `₹${formatCurrency(service.total.invoiced / 100000)} Cr` : '-'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 pl-4">Recd. against Invoice</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.India.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.India.received ? `₹${formatCurrency(service.regions.India.received / 100000)} Cr` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.MEA.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.MEA.received ? `$${formatCurrency(service.regions.MEA.received / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.SEA.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.SEA.received ? `$${formatCurrency(service.regions.SEA.received / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions.ROW.deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions.ROW.received ? `$${formatCurrency(service.regions.ROW.received / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions['PV Global'].deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions['PV Global'].received ? `$${formatCurrency(service.regions['PV Global'].received / 1000)} K` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center">{service.regions['PV India'].deals || '-'}</td>
                              <td className="border border-slate-300 p-2 text-right">{service.regions['PV India'].received ? `₹${formatCurrency(service.regions['PV India'].received / 100000)} Cr` : '-'}</td>
                              <td className="border border-slate-300 p-2 text-center bg-slate-100 font-semibold">{service.total.deals}</td>
                              <td className="border border-slate-300 p-2 text-right bg-slate-100 font-semibold">{service.total.received ? `₹${formatCurrency(service.total.received / 100000)} Cr` : '-'}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        {/* Total Section */}
                        <tr className="bg-slate-200 font-bold">
                          <td colSpan="15" className="border border-slate-300 p-2">Total</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2 pl-4">% contribution</td>
                          <td colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">{regionReportData.total.contribution.India}</td>
                          <td colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">{regionReportData.total.contribution.MEA}</td>
                          <td colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">{regionReportData.total.contribution.SEA}</td>
                          <td colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">{regionReportData.total.contribution.ROW}</td>
                          <td colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">{regionReportData.total.contribution['PV Global']}</td>
                          <td colSpan="2" className="border border-slate-300 p-2 text-center font-semibold">{regionReportData.total.contribution['PV India']}</td>
                          <td colSpan="2" className="border border-slate-300 p-2 text-center font-semibold bg-slate-100">100%</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 pl-4">PO / OF signed</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.India.deals}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.India.signed ? `₹${formatCurrency(regionReportData.total.regions.India.signed / 100000)} Cr` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.MEA.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.MEA.signed ? `$${formatCurrency(regionReportData.total.regions.MEA.signed / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.SEA.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.SEA.signed ? `$${formatCurrency(regionReportData.total.regions.SEA.signed / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.ROW.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.ROW.signed ? `$${formatCurrency(regionReportData.total.regions.ROW.signed / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions['PV Global'].deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions['PV Global'].signed ? `$${formatCurrency(regionReportData.total.regions['PV Global'].signed / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions['PV India'].deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions['PV India'].signed ? `₹${formatCurrency(regionReportData.total.regions['PV India'].signed / 100000)} Cr` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center bg-slate-100 font-bold">{regionReportData.total.total.deals}</td>
                          <td className="border border-slate-300 p-2 text-right bg-slate-100 font-bold">{regionReportData.total.total.signed ? `₹${formatCurrency(regionReportData.total.total.signed / 100000)} Cr` : '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 pl-4">Advance received</td>
                          <td className="border border-slate-300 p-2 text-center">-</td>
                          <td className="border border-slate-300 p-2 text-right">-</td>
                          <td className="border border-slate-300 p-2 text-center">-</td>
                          <td className="border border-slate-300 p-2 text-right">-</td>
                          <td className="border border-slate-300 p-2 text-center">-</td>
                          <td className="border border-slate-300 p-2 text-right">-</td>
                          <td className="border border-slate-300 p-2 text-center">-</td>
                          <td className="border border-slate-300 p-2 text-right">-</td>
                          <td className="border border-slate-300 p-2 text-center">-</td>
                          <td className="border border-slate-300 p-2 text-right">-</td>
                          <td className="border border-slate-300 p-2 text-center">-</td>
                          <td className="border border-slate-300 p-2 text-right">-</td>
                          <td className="border border-slate-300 p-2 text-center bg-slate-100">-</td>
                          <td className="border border-slate-300 p-2 text-right bg-slate-100">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 pl-4">Invoiced / Delivered</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.India.deals}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.India.invoiced ? `₹${formatCurrency(regionReportData.total.regions.India.invoiced / 100000)} Cr` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.MEA.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.MEA.invoiced ? `$${formatCurrency(regionReportData.total.regions.MEA.invoiced / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.SEA.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.SEA.invoiced ? `$${formatCurrency(regionReportData.total.regions.SEA.invoiced / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.ROW.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.ROW.invoiced ? `$${formatCurrency(regionReportData.total.regions.ROW.invoiced / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions['PV Global'].deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions['PV Global'].invoiced ? `$${formatCurrency(regionReportData.total.regions['PV Global'].invoiced / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions['PV India'].deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions['PV India'].invoiced ? `₹${formatCurrency(regionReportData.total.regions['PV India'].invoiced / 100000)} Cr` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center bg-slate-100 font-bold">{regionReportData.total.total.deals}</td>
                          <td className="border border-slate-300 p-2 text-right bg-slate-100 font-bold">{regionReportData.total.total.invoiced ? `₹${formatCurrency(regionReportData.total.total.invoiced / 100000)} Cr` : '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 pl-4">Recd. against Invoice</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.India.deals}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.India.received ? `₹${formatCurrency(regionReportData.total.regions.India.received / 100000)} Cr` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.MEA.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.MEA.received ? `$${formatCurrency(regionReportData.total.regions.MEA.received / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.SEA.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.SEA.received ? `$${formatCurrency(regionReportData.total.regions.SEA.received / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions.ROW.deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions.ROW.received ? `$${formatCurrency(regionReportData.total.regions.ROW.received / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions['PV Global'].deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions['PV Global'].received ? `$${formatCurrency(regionReportData.total.regions['PV Global'].received / 1000)} K` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{regionReportData.total.regions['PV India'].deals || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">{regionReportData.total.regions['PV India'].received ? `₹${formatCurrency(regionReportData.total.regions['PV India'].received / 100000)} Cr` : '-'}</td>
                          <td className="border border-slate-300 p-2 text-center bg-slate-100 font-bold">{regionReportData.total.total.deals}</td>
                          <td className="border border-slate-300 p-2 text-right bg-slate-100 font-bold">{regionReportData.total.total.received ? `₹${formatCurrency(regionReportData.total.total.received / 100000)} Cr` : '-'}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}