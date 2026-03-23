import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BulkUploadDialog({ open, onOpenChange, entityName, schema, onSuccess, templateData }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setErrors([]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = templateData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorFile = () => {
    // Handle file-level errors
    if (result?.isFileError) {
      const errorContent = `File Upload Error Report\n\nError Type: Invalid File\nError Details: ${result.error}\n\nCommon Issues:\n- File format not supported (use CSV or Excel)\n- File is corrupted or empty\n- Column headers don't match the template\n- Data format doesn't match the expected schema\n\nPlease:\n1. Download the template file\n2. Ensure your data matches the template format\n3. Save as CSV or Excel format\n4. Try uploading again`;
      
      const blob = new Blob([errorContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityName}_file_error_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }

    // Handle row-level errors
    if (errors.length === 0) return;

    const headers = ['Row Number', 'Error Reason', 'Data'];
    const rows = errors.map(err => [
      err.row,
      err.error,
      JSON.stringify(err.data)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName}_upload_errors_${new Date().toISOString().split('T')[0]}.csv`;
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

      // Extract data from file - use custom function for Excel files
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let extractResult;
      
      if (isExcel) {
        const response = await base44.functions.invoke('parseExcelFile', {
          file_url,
          json_schema: schema
        });
        extractResult = response.data;
      } else {
        extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: schema
        });
      }

      setProgress(60);

      if (extractResult.status === 'error') {
        const errorResult = { success: false, error: extractResult.details, isFileError: true };
        setResult(errorResult);
        setUploading(false);
        return;
      }

      // Bulk create records with error tracking and duplicate detection for Account entity
      const data = Array.isArray(extractResult.output) ? extractResult.output : [extractResult.output];
      const errorList = [];
      let successCount = 0;
      let skippedCount = 0;
      
      // For Account entity, fetch existing accounts to check for duplicates and map parent codes
      let existingCodes = [];
      let accountsMap = {};
      if (entityName === 'Account') {
        const existingAccounts = await base44.entities.Account.list();
        // Filter out soft-deleted accounts
        const activeAccounts = existingAccounts.filter(acc => !acc.is_deleted);
        existingCodes = activeAccounts.map(acc => acc.code);
        accountsMap = activeAccounts.reduce((map, acc) => {
          map[acc.code] = acc.id;
          return map;
        }, {});
      }

      for (let i = 0; i < data.length; i++) {
        try {
          // Check for duplicate code in Account entity
          if (entityName === 'Account' && data[i].code && existingCodes.includes(data[i].code)) {
            skippedCount++;
            errorList.push({
              row: i + 2,
              data: data[i],
              error: 'Skipped - Account code already exists'
            });
            continue;
          }
          
          // Map parentAccount code to ID for Account entity
          if (entityName === 'Account' && data[i].parentAccount) {
            const parentCode = data[i].parentAccount;
            const parentId = accountsMap[parentCode];
            
            if (!parentId) {
              errorList.push({
                row: i + 2,
                data: data[i],
                error: `Parent account code "${parentCode}" not found`
              });
              continue;
            }
            
            data[i].parentAccount = parentId;
          }
          
          await base44.entities[entityName].create(data[i]);
          successCount++;
        } catch (error) {
          errorList.push({
            row: i + 2, // +2 because row 1 is header, and array is 0-indexed
            data: data[i],
            error: error.message || 'Unknown error'
          });
        }
        setProgress(60 + (40 * (i + 1) / data.length));
      }
      
      setProgress(100);
      setErrors(errorList);
      setResult({ 
        success: errorList.length === 0, 
        count: successCount,
        totalRows: data.length,
        errorCount: errorList.length - skippedCount,
        skippedCount: skippedCount
      });
      
      if (errorList.length === 0) {
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setFile(null);
          setResult(null);
          setErrors([]);
          setProgress(0);
        }, 1500);
      } else {
        onSuccess();
      }

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
            Bulk Upload {entityName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              Upload a CSV or Excel file (.csv, .xlsx, .xls) with your data. Download the template to see the required format.
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
                {progress < 30 ? 'Uploading file...' : progress < 60 ? 'Extracting data...' : 'Creating records...'}
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.error ? (
                    `Error: ${result.error}`
                  ) : result.success ? (
                    `Successfully uploaded ${result.count} of ${result.totalRows} records!${result.skippedCount > 0 ? ` (${result.skippedCount} skipped - duplicate codes)` : ''}`
                  ) : (
                    <div className="space-y-1">
                      <div>Uploaded {result.count} of {result.totalRows} records.</div>
                      {result.skippedCount > 0 && <div className="text-amber-700">{result.skippedCount} rows skipped (duplicate codes).</div>}
                      {result.errorCount > 0 && <div className="font-semibold text-rose-700">{result.errorCount} rows failed - download error file below for details.</div>}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              
              {(errors.length > 0 || result.isFileError) && (
                <div className="border-2 border-rose-200 rounded-lg p-4 bg-rose-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-semibold text-rose-900 text-sm mb-1">
                          {result.isFileError ? 'File upload failed' : `${errors.length} rows failed to upload`}
                        </p>
                        <p className="text-rose-700 text-xs">
                          {result.isFileError 
                            ? 'Download the error report to understand why the file was rejected.'
                            : 'Download the error file to see which rows failed and why.'}
                        </p>
                      </div>
                      <Button 
                        onClick={downloadErrorFile}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Error Report
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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