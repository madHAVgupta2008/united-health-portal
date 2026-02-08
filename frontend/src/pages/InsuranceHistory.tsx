import React, { useState } from 'react';
import { FileText, Search, Download, Eye, Calendar, CheckCircle, Clock, XCircle, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/contexts/DatabaseContext';
import { supabase } from '@/integrations/supabase/client';

import { useToast } from '@/hooks/use-toast';
import { analyzeInsuranceDetails, InsuranceAnalysisResult } from '@/services/ai';
import InsuranceAnalysisModal from '@/components/insurance/InsuranceAnalysisModal';

const InsuranceHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { insuranceFiles, deleteDocument, updateDocumentAnalysis } = useDatabase();
  const { toast } = useToast();

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<InsuranceAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteDocument = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        setDeletingId(docId);
        await deleteDocument(docId);
        toast({
          title: 'Document Deleted',
          description: 'The document has been permanently deleted.',
        });
      } catch (error) {
        console.error('Error deleting document:', error);
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete the document.',
          variant: 'destructive',
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleAnalyzeDocument = async (doc: any) => {
    // If analysis already exists, use it
    if (doc.analysisResult) {
      setAnalysisResult(doc.analysisResult);
      setIsAnalysisModalOpen(true);
      return;
    }

    const docUrl = doc.fileUrl;
    if (!docUrl) {
      toast({
        title: "No File",
        description: "This document does not have an attached file to analyze.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setIsAnalysisModalOpen(true);

      let finalUrl = docUrl;
      if (docUrl.includes('supabase.co') && docUrl.includes('insurance-documents')) {
        const path = docUrl.split('insurance-documents/')[1]?.split('?')[0];
        if (path) {
          const decodedPath = decodeURIComponent(path);
          const { data } = await supabase.storage
            .from('insurance-documents')
            .createSignedUrl(decodedPath, 3600);
          if (data?.signedUrl) finalUrl = data.signedUrl;
        }
      }

      const response = await fetch(finalUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      const blob = await response.blob();

      // Ensure we have a valid mime type, default to jpeg if unknown/octet-stream
      const mimeType = (blob.type && blob.type !== 'application/octet-stream') ? blob.type : 'image/jpeg';
      const file = new File([blob], "document.jpg", { type: mimeType });

      const result = await analyzeInsuranceDetails(file);

      if (result) {
        setAnalysisResult(result);

        // Save result to database
        try {
          await updateDocumentAnalysis(doc.id, result);
        } catch (saveError) {
          console.error("Failed to save analysis:", saveError);
          // Don't block UI on save failure
        }
      } else {
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the document structure.",
          variant: "destructive"
        });
        setIsAnalysisModalOpen(false);
      }

    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process the insurance document.",
        variant: "destructive"
      });
      setIsAnalysisModalOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredFiles = insuranceFiles.filter((file) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.fileType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || file.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return '';
    }
  };

  const stats = [
    { label: 'Total Documents', value: insuranceFiles.length, color: 'bg-primary/10 text-primary' },
    { label: 'Approved', value: insuranceFiles.filter((f) => f.status === 'approved').length, color: 'bg-success/10 text-success' },
    { label: 'Rejected', value: insuranceFiles.filter((f) => f.status === 'rejected').length, color: 'bg-destructive/10 text-destructive' },
  ];

  const handleFileAction = async (url: string, fileName: string, action: 'view' | 'download') => {
    try {
      let finalUrl = url;

      // Check if it's a Supabase storage URL for insurance-documents
      if (url.includes('supabase.co') && url.includes('insurance-documents')) {
        // Extract path and remove any existing query parameters
        const path = url.split('insurance-documents/')[1]?.split('?')[0];
        if (path) {
          const decodedPath = decodeURIComponent(path);
          const { data, error } = await supabase.storage
            .from('insurance-documents')
            .createSignedUrl(decodedPath, 3600, {
              download: action === 'download' ? true : false,
            }); // 1 hour expiry

          if (!error && data?.signedUrl) {
            finalUrl = data.signedUrl;
          } else {
            console.error('Error creating signed URL:', error);
          }
        }
      }

      if (action === 'download') {
        try {
          // Fetch the file as a blob to avoid page navigation
          const response = await fetch(finalUrl, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', fileName || 'document');
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();

          // Clean up after a short delay
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
        } catch (downloadError) {
          console.error('Download failed, using iframe fallback:', downloadError);
          // Use iframe to download without navigating away from current page
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = finalUrl;
          document.body.appendChild(iframe);

          // Clean up iframe after download starts
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 5000);
        }
      } else {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error handling file action:', error);
      // Last resort: open in new tab with safety flags
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Insurance Documents</h1>
        <p className="text-muted-foreground mt-1">View and manage your uploaded insurance documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-elevated">
            <CardContent className="pt-6">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', stat.color)}>
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 input-focus"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'approved', 'rejected'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  className={cn(filterStatus === status && 'btn-primary')}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Document History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.fileName}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{file.fileType}</span>
                      <span>•</span>
                      <span>{file.fileSize}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={cn('flex items-center gap-1', getStatusColor(file.status))}
                    variant="outline"
                  >
                    {getStatusIcon(file.status)}
                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFileAction(file.fileUrl, file.fileName, 'view')}
                  >
                    <Eye className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFileAction(file.fileUrl, file.fileName, 'download')}
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    title="AI Analysis"
                    onClick={() => handleAnalyzeDocument(file)}
                  >
                    <Sparkles className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteDocument(file.id)}
                    disabled={deletingId === file.id}
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InsuranceAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        result={analysisResult}
        isLoading={isAnalyzing}
      />
    </div>
  );
};

export default InsuranceHistory;
