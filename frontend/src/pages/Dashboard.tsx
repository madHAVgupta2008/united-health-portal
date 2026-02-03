import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Receipt, 
  MessageCircle, 
  Clock,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { bills, insuranceFiles, isLoading } = useDatabase();

  const activeClaims = insuranceFiles.filter(f => f.status === 'pending').length;
  
  const pendingBills = bills
    .filter(b => b.status === 'pending')
    .reduce((sum, bill) => sum + bill.amount, 0);

  // Generate recent activity from real data
  const recentActivity = [
    ...insuranceFiles.map(f => ({
      type: 'insurance',
      text: f.fileName,
      date: new Date(f.uploadDate),
      status: f.status === 'approved' ? 'success' : f.status === 'rejected' ? 'error' : 'pending'
    })),
    ...bills.map(b => ({
      type: 'bill',
      text: `Bill for ${b.hospitalName}`,
      date: new Date(b.billDate),
      status: b.status === 'paid' ? 'success' : 'pending'
    }))
  ]
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 4)
  .map(item => ({
    ...item,
    date: item.date.toLocaleDateString(),
    displayStatus: item.status // map to UI status
  }));

  const quickActions = [
    {
      title: 'Upload Insurance',
      description: 'Submit new insurance documents',
      icon: FileText,
      path: '/insurance-upload',
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Submit Bill',
      description: 'Upload hospital bills for processing',
      icon: Receipt,
      path: '/bill-upload',
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'AI Assistant',
      description: 'Get help with your questions',
      icon: MessageCircle,
      path: '/chat',
      color: 'bg-success/10 text-success',
    },
    {
      title: 'View History',
      description: 'Check your document history',
      icon: Clock,
      path: '/insurance-history',
      color: 'bg-warning/10 text-warning',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your healthcare finances
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Member ID</p>
            <p className="font-semibold text-foreground">{user?.memberId || 'N/A'}</p>
          </div>
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plan Type</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground mt-1">{user?.planType || 'Standard'}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Claims</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground mt-1">{activeClaims}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Bills</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${pendingBills.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <Card className="card-elevated hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  <ArrowRight className="w-5 h-5 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.status === 'success' ? 'bg-success/10' : 
                      activity.status === 'error' ? 'bg-destructive/10' : 'bg-warning/10'
                    }`}>
                      {activity.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : activity.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{activity.text}</p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                   <p>No recent activity</p>
                   <Button variant="link" asChild className="text-primary p-0 h-auto">
                     <Link to="/insurance-upload">Upload your first document</Link>
                   </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our AI assistant is available 24/7 to help you with questions about your insurance, bills, and more.
            </p>
            <Link to="/chat">
              <Button className="w-full btn-primary">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Chat
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
