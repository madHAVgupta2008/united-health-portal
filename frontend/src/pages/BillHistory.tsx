import React, { useState } from 'react';
import { Receipt, Search, Download, Eye, Calendar, DollarSign, Building2, CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HospitalBill } from '@/types';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/contexts/DatabaseContext';

const BillHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { bills: hospitalBills } = useDatabase();

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
    { label: 'Total Records', value: hospitalBills.length, color: 'bg-accent/10 text-accent', icon: CreditCard },
  ];

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
                  <Badge
                    className={cn('flex items-center gap-1', getStatusColor(bill.status))}
                    variant="outline"
                  >
                    {getStatusIcon(bill.status)}
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
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

            {filteredBills.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bills found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillHistory;
