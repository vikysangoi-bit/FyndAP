import React, { useCallback, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FileUploader({ onUploadComplete, category = "other", multiple = true }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({
        name: file.name,
        file_url: result.file_url,
        file_type: file.type,
        file_size: file.size,
        category
      });
      setProgress(((i + 1) / files.length) * 100);
    }

    setUploadedFiles(uploaded);
    setUploading(false);
    onUploadComplete?.(uploaded);
  }, [category, onUploadComplete]);

  const clearUploaded = () => {
    setUploadedFiles([]);
    setProgress(0);
  };

  return (
    <Card className="p-6 border-2 border-dashed border-slate-200 bg-slate-50/50">
      {uploadedFiles.length === 0 ? (
        <label className="flex flex-col items-center justify-center cursor-pointer py-8">
          <div className="p-4 rounded-2xl bg-white shadow-sm mb-4">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-700 font-medium mb-1">
            {uploading ? 'Uploading...' : 'Click or drag files to upload'}
          </p>
          <p className="text-sm text-slate-500">
            {multiple ? 'You can upload multiple files' : 'Select a file to upload'}
          </p>
          <input
            type="file"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          {uploading && (
            <div className="w-full max-w-xs mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500 text-center mt-2">{Math.round(progress)}% complete</p>
            </div>
          )}
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Files uploaded successfully</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearUploaded}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <File className="w-5 h-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.file_size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}