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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

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

  const recentActivity = [
    { type: 'insurance', text: 'Insurance card uploaded', date: '2 hours ago', status: 'success' },
    { type: 'bill', text: 'Hospital bill submitted', date: '1 day ago', status: 'pending' },
    { type: 'insurance', text: 'Claim #12345 approved', date: '3 days ago', status: 'success' },
    { type: 'bill', text: 'Payment processed', date: '5 days ago', status: 'success' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your healthcare finances
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Member ID</p>
            <p className="font-semibold text-foreground">{user?.memberId}</p>
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
                <p className="text-2xl font-bold text-foreground mt-1">{user?.planType}</p>
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
                <p className="text-2xl font-bold text-foreground mt-1">3</p>
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
                <p className="text-2xl font-bold text-foreground mt-1">$1,245.00</p>
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-success/10' : 'bg-warning/10'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.text}</p>
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
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
