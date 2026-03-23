import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import SearchFilter from "@/components/shared/SearchFilter";
import EmptyState from "@/components/shared/EmptyState";
import FileUploader from "@/components/documents/FileUploader";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, File, FileImage, FileSpreadsheet, 
  Download, Trash2, FolderOpen, Clock, User
} from "lucide-react";
import { format } from "date-fns";

const categories = [
  { value: "invoices", label: "Invoices" },
  { value: "purchase_orders", label: "Purchase Orders" },
  { value: "contracts", label: "Contracts" },
  { value: "reports", label: "Reports" },
  { value: "compliance", label: "Compliance" },
  { value: "other", label: "Other" },
];

const getFileIcon = (type) => {
  if (type?.includes('image')) return FileImage;
  if (type?.includes('spreadsheet') || type?.includes('excel') || type?.includes('csv')) return FileSpreadsheet;
  if (type?.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Documents() {
  const [showUpload, setShowUpload] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [docForm, setDocForm] = useState({ description: '', category: 'other', tags: '' });

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date')
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUpload(false);
      setUploadedFiles([]);
      setDocForm({ description: '', category: 'other', tags: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteDoc(null);
    }
  });

  const handleUploadComplete = (files) => {
    setUploadedFiles(files);
  };

  const saveDocuments = () => {
    const docs = uploadedFiles.map(file => ({
      ...file,
      description: docForm.description,
      category: docForm.category,
      tags: docForm.tags ? docForm.tags.split(',').map(t => t.trim()) : [],
      uploaded_by: user?.email
    }));
    createMutation.mutate(docs);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader 
          title="Documents" 
          subtitle="File repository and document management"
          onAdd={() => setShowUpload(true)}
          addLabel="Upload Files"
        />

        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search documents..."
          filters={[
            {
              key: 'category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              placeholder: 'Category',
              options: categories
            }
          ]}
        />

        {!isLoading && documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents"
            description="Upload your first document to start building your repository."
            actionLabel="Upload Files"
            onAction={() => setShowUpload(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              return (
                <Card key={doc.id} className="p-4 border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                      <Icon className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{doc.name}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{doc.description || 'No description'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs capitalize">
                          {doc.category?.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {doc.uploaded_by || doc.created_by}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {doc.created_date ? format(new Date(doc.created_date), 'MMM d, yyyy') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteDoc(doc)} className="text-rose-600 hover:text-rose-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FileUploader onUploadComplete={handleUploadComplete} category={docForm.category} />

              {uploadedFiles.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={docForm.category} onValueChange={(v) => setDocForm({ ...docForm, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={docForm.description}
                      onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                      placeholder="Add a description for these files..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={docForm.tags}
                      onChange={(e) => setDocForm({ ...docForm, tags: e.target.value })}
                      placeholder="invoice, 2024, supplier-a"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
              <Button 
                onClick={saveDocuments}
                disabled={uploadedFiles.length === 0 || createMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {createMutation.isPending ? 'Saving...' : `Save ${uploadedFiles.length} File(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteDoc}
          onOpenChange={() => setDeleteDoc(null)}
          title="Delete Document"
          description={`Are you sure you want to delete "${deleteDoc?.name}"?`}
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteDoc.id)}
          variant="destructive"
        />
      </div>
    </div>
  );
}