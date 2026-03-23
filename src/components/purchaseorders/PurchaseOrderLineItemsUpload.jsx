import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PurchaseOrderLineItemsUpload({ open, onOpenChange, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'styleId,quantity,rate_per_unit,item_expected_delivery',
      'STY001,100,150,2026-03-25'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'po_lineitems_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProgress(30);

      // Extract data from file
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let extractResult;
      
      if (isExcel) {
        const response = await base44.functions.invoke('parseExcelFile', {
          file_url,
          json_schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                styleId: { type: "string" },
                quantity: { type: "number" },
                rate_per_unit: { type: "number" },
                item_expected_delivery: { type: "string" }
              }
            }
          }
        });
        extractResult = response.data;
      } else {
        extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                styleId: { type: "string" },
                quantity: { type: "number" },
                rate_per_unit: { type: "number" },
                item_expected_delivery: { type: "string" }
              }
            }
          }
        });
      }

      setProgress(60);

      if (extractResult.status === 'error') {
        setResult({ success: false, error: extractResult.details });
        setUploading(false);
        return;
      }

      // Fetch inventory items to validate and enrich
      const inventoryItems = await base44.entities.InventoryItem.list();
      const inventoryMapByStyleId = inventoryItems.reduce((map, item) => {
        if (item.styleID) {
          map[item.styleID] = item;
        }
        return map;
      }, {});

      setProgress(80);

      const lineItems = Array.isArray(extractResult.output) ? extractResult.output : [extractResult.output];
      
      // Enrich with inventory data and calculate values
      const enrichedItems = lineItems.map(item => {
        const inventoryItem = inventoryMapByStyleId[item.styleId];
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate_per_unit) || 0;
        const net_before_gst = quantity * rate;
        const gst_percentage = rate < 2500 ? 5 : 18;
        const gst_amount = (net_before_gst * gst_percentage) / 100;
        const gross_value = net_before_gst + gst_amount;

        return {
          itemCode: inventoryItem?.itemCode || inventoryItem?.sku || '',
          styleID: item.styleId || '',
          articleNo: inventoryItem?.articleNo || '',
          itemCategory: inventoryItem?.itemCategory || '',
          description: inventoryItem?.name || inventoryItem?.description || '',
          composition: inventoryItem?.composition || '',
          size: inventoryItem?.size || '',
          color: inventoryItem?.color || '',
          hsnCode: inventoryItem?.hsnCode || '',
          quantity,
          rate_per_unit: rate,
          net_before_gst,
          gst_percentage,
          gross_value,
          item_expected_delivery: item.item_expected_delivery || ''
        };
      });

      setProgress(100);
      setResult({ success: true, count: enrichedItems.length });
      
      setTimeout(() => {
        onSuccess(enrichedItems);
        onOpenChange(false);
        setFile(null);
        setResult(null);
        setProgress(0);
      }, 1000);

    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload PO Line Items
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              Upload CSV or Excel with styleId, quantity, rate_per_unit, item_expected_delivery. Details auto-fetched from inventory.
            </AlertDescription>
          </Alert>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          <div className="space-y-2">
            <Label htmlFor="file">Select File (CSV or Excel)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-xs text-slate-500 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-slate-500 text-center">
                {progress < 30 ? 'Uploading file...' : progress < 60 ? 'Extracting data...' : progress < 80 ? 'Validating items...' : 'Processing...'}
              </p>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.error ? `Error: ${result.error}` : `Successfully loaded ${result.count} line items!`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading} className="bg-slate-900 hover:bg-slate-800">
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}