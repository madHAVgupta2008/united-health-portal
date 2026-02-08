import React, { useState } from 'react';
import { Receipt, Search, Download, Eye, Calendar, DollarSign, Building2, CheckCircle, Clock, XCircle, Trash2, Sparkles, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDatabase, Bill } from '@/contexts/DatabaseContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useToast } from '@/hooks/use-toast';
import { analyzeBillDetails, BillAnalysisResult } from '@/services/ai';
import BillAnalysisModal from '@/components/bill/BillAnalysisModal';

const BillHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { bills: hospitalBills, insuranceFiles, updateBillStatus, updateBillAnalysis, deleteBill } = useDatabase();
  const { toast } = useToast();

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BillAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeBill = async (bill: any) => {
    // If analysis already exists, use it
    if (bill.analysisResult) {
      setAnalysisResult(bill.analysisResult);
      setIsAnalysisModalOpen(true);
      return;
    }

    if (!bill.fileUrl) {
      toast({
        title: "No File",
        description: "This bill does not have an attached file to analyze.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setIsAnalysisModalOpen(true);

      // fetch file blob
      let finalUrl = bill.fileUrl;
      if (bill.fileUrl.includes('supabase.co') && bill.fileUrl.includes('hospital-bills')) {
        const path = bill.fileUrl.split('hospital-bills/')[1]?.split('?')[0];
        if (path) {
          const decodedPath = decodeURIComponent(path);
          const { data } = await supabase.storage
            .from('hospital-bills')
            .createSignedUrl(decodedPath, 3600);
          if (data?.signedUrl) finalUrl = data.signedUrl;
        }
      }

      const response = await fetch(finalUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch bill file: ${response.statusText}`);
      }
      const blob = await response.blob();

      // Ensure we have a valid mime type, default to jpeg if unknown/octet-stream
      const mimeType = (blob.type && blob.type !== 'application/octet-stream') ? blob.type : 'image/jpeg';
      const file = new File([blob], "bill.jpg", { type: mimeType });

      // Prepare Insurance Context
      // Find the most recent approved insurance document with analysis
      const activeInsurance = insuranceFiles.find(doc => doc.status === 'approved' && doc.analysisResult);
      let insuranceContext = "";

      if (activeInsurance && activeInsurance.analysisResult) {
        const result = activeInsurance.analysisResult;
        insuranceContext = `
          Policy: ${result.overview?.insurerName || 'Unknown Insurer'} - ${result.overview?.policyNumber || 'N/A'}
          Effective Date: ${result.overview?.effectiveDate || 'N/A'}
          Expiration Date: ${result.overview?.expirationDate || 'N/A'}
          
          Financials:
          - Deductible: Individual ${result.financials?.deductible?.individual || 'N/A'}, Family ${result.financials?.deductible?.family || 'N/A'}
          - Out-of-Pocket Max: Individual ${result.financials?.outOfPocketMax?.individual || 'N/A'}, Family ${result.financials?.outOfPocketMax?.family || 'N/A'}
          - Co-insurance: In-Network ${result.financials?.coinsuranceRate?.inNetwork || 'N/A'}, Out-of-Network ${result.financials?.coinsuranceRate?.outOfNetwork || 'N/A'}
          - Copays: PCP ${result.financials?.copay?.pcp || 'N/A'}, Specialist ${result.financials?.copay?.specialist || 'N/A'}, ER ${result.financials?.copay?.er || 'N/A'}
          
          Coverage Details:
          ${result.coverage?.map((c: any) => `- ${c.type}: Limit ${c.limit}, Deductible ${c.deductible}, Copay ${c.copay}`).join('\n') || 'No specific coverage details found.'}
          
          Benefits:
          ${result.benefits?.filter((b: any) => b.covered).map((b: any) => `- ${b.category}: ${b.description}`).join('\n') || 'No specific benefits listed.'}
          
          Exclusions:
          ${result.exclusions?.map((e: any) => `- ${e.item}: ${e.reason}`).join('\n') || 'No specific exclusions listed.'}
        `;
      }

      const result = await analyzeBillDetails(file, insuranceContext);

      if (result) {
        setAnalysisResult(result);

        // Save the analysis result to the database for future use
        const { error } = await supabase
          .from('hospital_bills')
          .update({ analysis_result: result } as any)
          .eq('id', bill.id);

        if (error) {
          console.error("Failed to save analysis result:", error);
        } else {
          // Update the local bill object in context
          updateBillAnalysis(bill.id, result);
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
        description: "Failed to process the bill file.",
        variant: "destructive"
      });
      setIsAnalysisModalOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChangeStatus = async (billId: string, newStatus: 'paid' | 'pending' | 'denied') => {
    try {
      await updateBillStatus(billId, newStatus);
      toast({
        title: 'Status Updated',
        description: `Bill marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update bill status.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      try {
        await deleteBill(billId);
        toast({
          title: 'Bill Deleted',
          description: 'The bill has been permanently deleted.',
        });
      } catch (error) {
        console.error('Error deleting bill:', error);
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete the bill.',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredBills = hospitalBills.filter((bill) => {
    const matchesSearch = bill.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'denied':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'denied':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return '';
    }
  };

  const totalAmount = hospitalBills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAmount = hospitalBills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
  const pendingAmount = hospitalBills.filter((b) => b.status === 'pending' || b.status === 'processing').reduce((sum, b) => sum + b.amount, 0);

  const stats = [
    { label: 'Total Bills', value: `$${totalAmount.toLocaleString()}`, color: 'bg-primary/10 text-primary', icon: Receipt },
    { label: 'Paid', value: `$${paidAmount.toLocaleString()}`, color: 'bg-success/10 text-success', icon: CheckCircle },
    { label: 'Pending', value: `$${pendingAmount.toLocaleString()}`, color: 'bg-warning/10 text-warning', icon: Clock },
    { label: 'Total Records', value: hospitalBills.length, color: 'bg-accent/10 text-accent', icon: Receipt },
  ];

  const handleFileAction = async (url: string | undefined, fileName: string | undefined, action: 'view' | 'download') => {
    if (!url) {
      alert('No file available for this bill.');
      return;
    }

    try {
      let finalUrl = url;

      // Check if it's a Supabase storage URL for hospital-bills
      if (url.includes('supabase.co') && url.includes('hospital-bills')) {
        // Extract path and remove any existing query parameters
        const path = url.split('hospital-bills/')[1]?.split('?')[0];
        if (path) {
          const decodedPath = decodeURIComponent(path);
          const { data, error } = await supabase.storage
            .from('hospital-bills')
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
          link.setAttribute('download', fileName || 'bill');
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
        <h1 className="text-3xl font-bold text-foreground">Hospital Bill History</h1>
        <p className="text-muted-foreground mt-1">Track and manage your hospital bills and payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-elevated">
            <CardContent className="pt-6">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', stat.color)}>
                <stat.icon className="w-6 h-6" />
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
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 input-focus"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'paid', 'pending', 'processing', 'denied'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  className={cn(filterStatus === status && 'btn-primary')}
                  size="sm"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Bill Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{bill.hospitalName}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{bill.description}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(bill.billDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground flex items-center">
                      <DollarSign className="w-5 h-5" />
                      {bill.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className={cn('h-8 border-dashed', getStatusColor(bill.status))}>
                          {getStatusIcon(bill.status)}
                          <span className="ml-2 capitalize">{bill.status}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleChangeStatus(bill.id, 'paid')}>
                          Mark as Paid / Settled
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(bill.id, 'pending')}>
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(bill.id, 'denied')}>
                          Mark as Denied
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileAction(bill.fileUrl, bill.hospitalName, 'view')}
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleAnalyzeBill(bill)}
                      title="Analyze with AI"
                    >
                      <Sparkles className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileAction(bill.fileUrl, bill.hospitalName, 'download')}
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteBill(bill.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredBills.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bills found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BillAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        result={analysisResult}
        isLoading={isAnalyzing}
      />
    </div>
  );
};

export default BillHistory;
