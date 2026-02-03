import React, { useState } from 'react';
import { Receipt, Upload, CheckCircle, Info, DollarSign, Building2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/ui/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/contexts/DatabaseContext';

const BillUpload: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    hospitalName: '',
    billDate: '',
    amount: '',
    description: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { addBill } = useDatabase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.hospitalName || !formData.billDate || !formData.amount || uploadedFiles.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and upload the bill.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addBill({
        hospitalName: formData.hospitalName,
        billDate: formData.billDate,
        amount: parseFloat(formData.amount),
        description: formData.description,
      }, uploadedFiles[0]); // Pass the first file

      toast({
        title: 'Bill Submitted',
        description: 'Your hospital bill has been uploaded for processing.',
      });

      // Reset form
      setFormData({ hospitalName: '', billDate: '', amount: '', description: '' });
      setUploadedFiles([]);
    } catch (error: unknown) {
      console.error('Detailed Bill Upload Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Upload Failed',
        description: errorMessage || 'There was an error uploading your bill. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Hospital Bill</h1>
        <p className="text-muted-foreground mt-1">
          Submit your hospital bills for insurance processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Bill Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital/Provider Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="hospitalName"
                      name="hospitalName"
                      placeholder="Enter hospital name"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      className="pl-10 h-12 input-focus"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billDate">Bill Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="billDate"
                      name="billDate"
                      type="date"
                      value={formData.billDate}
                      onChange={handleChange}
                      className="pl-10 h-12 input-focus"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Bill Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    className="pl-10 h-12 input-focus"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description of Services</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the medical services received..."
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-[100px] input-focus"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Bill Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple={true}
                maxSize={10}
                label="Upload Hospital Bill"
              />
            </CardContent>
          </Card>

          <Button 
            onClick={handleSubmit} 
            className="w-full h-12 btn-primary text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Processing with AI...' : 'Submit Bill'}
          </Button>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-5 h-5 text-primary" />
                Submission Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-foreground">Clear Images</p>
                <p className="text-muted-foreground mt-1">
                  Ensure all text on the bill is readable
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-foreground">Complete Bills</p>
                <p className="text-muted-foreground mt-1">
                  Include all pages of multi-page bills
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-foreground">Itemized Statements</p>
                <p className="text-muted-foreground mt-1">
                  Upload itemized bills when available
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated bg-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <p className="font-semibold text-foreground mb-2">Need Help?</p>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI assistant can help you understand your bills and coverage.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/chat">Ask AI Assistant</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillUpload;
