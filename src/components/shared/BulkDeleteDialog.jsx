import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Trash2, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BulkDeleteDialog({ open, onOpenChange, entityName, onSuccess, identifierField = 'code' }) {
  const [file, setFile] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
    const csvContent = `${identifierField}\n"EXAMPLE_CODE_1"\n"EXAMPLE_CODE_2"`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName}_delete_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorFile = () => {
    if (errors.length === 0) return;

    const headers = ['Identifier', 'Error Reason'];
    const rows = errors.map(err => [err.identifier, err.error]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName}_delete_errors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!file) return;

    setDeleting(true);
    setProgress(10);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProgress(30);

      // Parse CSV file
      const response = await fetch(file_url);
      const text = await response.text();
      const lines = text.trim().split('\n');
      const identifiers = lines.slice(1).map(line => line.replace(/"/g, '').trim()).filter(Boolean);

      setProgress(50);

      if (identifiers.length === 0) {
        setResult({ success: false, error: 'No identifiers found in file' });
        setDeleting(false);
        return;
      }

      // Fetch all records and delete matching ones
      const allRecords = await base44.entities[entityName].list();
      const errorList = [];
      let successCount = 0;

      for (let i = 0; i < identifiers.length; i++) {
        try {
          const record = allRecords.find(r => r[identifierField] === identifiers[i]);
          if (!record) {
            errorList.push({
              identifier: identifiers[i],
              error: 'Record not found'
            });
          } else {
            await base44.entities[entityName].delete(record.id);
            successCount++;
          }
        } catch (error) {
          errorList.push({
            identifier: identifiers[i],
            error: error.message || 'Unknown error'
          });
        }
        setProgress(50 + (50 * (i + 1) / identifiers.length));
      }
      
      setProgress(100);
      setErrors(errorList);
      setResult({ 
        success: errorList.length === 0, 
        count: successCount,
        totalRows: identifiers.length,
        errorCount: errorList.length
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
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Trash2 className="w-5 h-5" />
            Bulk Delete {entityName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: This will permanently delete records. Upload a CSV file with {identifierField}s to delete.
            </AlertDescription>
          </Alert>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          <div className="space-y-2">
            <Label htmlFor="delete-file">Select CSV File</Label>
            <Input
              id="delete-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={deleting}
            />
            {file && (
              <p className="text-xs text-slate-500 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          {deleting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-slate-500 text-center">
                {progress < 30 ? 'Uploading file...' : progress < 50 ? 'Processing...' : 'Deleting records...'}
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
                    `Successfully deleted ${result.count} of ${result.totalRows} records!`
                  ) : (
                    <div className="space-y-1">
                      <div>Deleted {result.count} of {result.totalRows} records.</div>
                      <div className="font-semibold text-rose-700">{result.errorCount} records failed - download error file below.</div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              
              {errors.length > 0 && (
                <Button 
                  onClick={downloadErrorFile}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Error Report
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            disabled={!file || deleting} 
            variant="destructive"
          >
            {deleting ? 'Deleting...' : 'Delete Records'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}