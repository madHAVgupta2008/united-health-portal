import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/ui/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/contexts/DatabaseContext';

const InsuranceUpload: React.FC = () => {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { uploadDocument } = useDatabase();

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!documentType || uploadedFiles.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a document type and upload at least one file.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Process the first uploaded file
      const file = uploadedFiles[0];
      await uploadDocument({
        fileName: file.name,
        fileType: documentTypes.find(t => t.value === documentType)?.label || 'Document',
      }, file);

      toast({
        title: 'Documents Submitted',
        description: 'Your insurance documents have been uploaded successfully.',
      });
      
      // Reset form
      setDocumentType('');
      setNotes('');
      setUploadedFiles([]);
    } catch (error: unknown) {
      console.error('Detailed Insurance Upload Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Upload Failed',
        description: errorMessage || 'There was an error uploading your documents. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const documentTypes = [
    { value: 'insurance-card', label: 'Insurance Card' },
    { value: 'policy-document', label: 'Policy Document' },
    { value: 'claim-form', label: 'Claim Form' },
    { value: 'eob', label: 'Explanation of Benefits (EOB)' },
    { value: 'pre-auth', label: 'Pre-Authorization' },
    { value: 'other', label: 'Other Document' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Insurance Documents</h1>
        <p className="text-muted-foreground mt-1">
          Submit your insurance documents securely for processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any relevant information about this document..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] input-focus"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple={true}
                maxSize={10}
                label="Upload Insurance Documents"
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
            {isLoading ? 'Uploading & Analyzing...' : 'Submit Documents'}
          </Button>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-5 h-5 text-primary" />
                Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-foreground">Accepted Formats</p>
                <p className="text-muted-foreground mt-1">PDF, JPG, JPEG, PNG</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-foreground">Maximum File Size</p>
                <p className="text-muted-foreground mt-1">10 MB per file</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-foreground">Processing Time</p>
                <p className="text-muted-foreground mt-1">1-3 business days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Secure Upload</p>
                  <p className="text-sm text-muted-foreground">256-bit encryption</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your documents are encrypted and stored securely. Only authorized personnel can access your files.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InsuranceUpload;
