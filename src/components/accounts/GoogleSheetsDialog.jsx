import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Sheet, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GoogleSheetsDialog({ open, onOpenChange, mode = 'import', onSuccess }) {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [clearExisting, setClearExisting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!spreadsheetId) return;

    setProcessing(true);
    setProgress(20);

    try {
      if (mode === 'import') {
        setProgress(40);
        const response = await base44.functions.invoke('syncAccountsFromSheets', {
          spreadsheetId,
          sheetName
        });
        setProgress(100);
        setResult({
          success: response.data.status === 'success',
          message: `${response.data.successCount} of ${response.data.total} accounts imported successfully`,
          details: response.data
        });
      } else {
        setProgress(40);
        const response = await base44.functions.invoke('exportAccountsToSheets', {
          spreadsheetId,
          sheetName,
          clearExisting
        });
        setProgress(100);
        setResult({
          success: true,
          message: response.data.message,
          details: response.data
        });
      }

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }, 2000);

    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'An error occurred'
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSpreadsheetId('');
    setSheetName('Sheet1');
    setClearExisting(false);
    setProgress(0);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'import' ? <Download className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {mode === 'import' ? 'Import from Google Sheets' : 'Export to Google Sheets'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              {mode === 'import' 
                ? 'Import accounts from a Google Sheet. Make sure the sheet is shared with your account and has the required columns (code, name, type, category).'
                : 'Export all accounts to a Google Sheet. Make sure the sheet is shared with your account with edit permissions.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="spreadsheetId">Spreadsheet ID *</Label>
            <Input
              id="spreadsheetId"
              placeholder="Paste spreadsheet ID or URL"
              value={spreadsheetId}
              onChange={(e) => {
                const value = e.target.value;
                // Extract ID from URL if full URL is pasted
                const match = value.match(/\/d\/([a-zA-Z0-9-_]+)/);
                setSpreadsheetId(match ? match[1] : value);
              }}
              disabled={processing}
            />
            <p className="text-xs text-slate-500">
              You can paste either the spreadsheet ID or the full URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheetName">Sheet Name</Label>
            <Input
              id="sheetName"
              placeholder="Sheet1"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              disabled={processing}
            />
          </div>

          {mode === 'export' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="clearExisting"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                disabled={processing}
                className="rounded border-slate-300"
              />
              <Label htmlFor="clearExisting" className="cursor-pointer">
                Clear existing data in sheet
              </Label>
            </div>
          )}

          {processing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-slate-500 text-center">
                {mode === 'import' ? 'Importing accounts...' : 'Exporting accounts...'}
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
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!spreadsheetId || processing} 
            className="bg-slate-900 hover:bg-slate-800"
          >
            {processing ? 'Processing...' : mode === 'import' ? 'Import' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}