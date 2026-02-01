import React, { useState } from 'react';
import { FileText, Search, Download, Eye, Calendar, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InsuranceFile } from '@/types';
import { cn } from '@/lib/utils';

const InsuranceHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data
  const insuranceFiles: InsuranceFile[] = [
    { id: '1', fileName: 'Insurance_Card_2024.pdf', fileType: 'Insurance Card', uploadDate: '2024-01-15', status: 'approved', fileSize: '1.2 MB' },
    { id: '2', fileName: 'Policy_Document.pdf', fileType: 'Policy Document', uploadDate: '2024-01-10', status: 'approved', fileSize: '3.5 MB' },
    { id: '3', fileName: 'Claim_Form_Dec.pdf', fileType: 'Claim Form', uploadDate: '2024-01-08', status: 'pending', fileSize: '845 KB' },
    { id: '4', fileName: 'EOB_Statement.pdf', fileType: 'EOB', uploadDate: '2024-01-05', status: 'approved', fileSize: '520 KB' },
    { id: '5', fileName: 'PreAuth_Request.pdf', fileType: 'Pre-Authorization', uploadDate: '2023-12-28', status: 'rejected', fileSize: '1.8 MB' },
    { id: '6', fileName: 'Updated_Card.jpg', fileType: 'Insurance Card', uploadDate: '2023-12-20', status: 'approved', fileSize: '2.1 MB' },
  ];

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
    { label: 'Pending', value: insuranceFiles.filter((f) => f.status === 'pending').length, color: 'bg-warning/10 text-warning' },
    { label: 'Rejected', value: insuranceFiles.filter((f) => f.status === 'rejected').length, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Insurance Documents</h1>
        <p className="text-muted-foreground mt-1">View and manage your uploaded insurance documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              {['all', 'approved', 'pending', 'rejected'].map((status) => (
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
                  <Button variant="ghost" size="icon">
                    <Eye className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="w-5 h-5" />
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
    </div>
  );
};

export default InsuranceHistory;
