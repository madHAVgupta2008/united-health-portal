import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  User,
  FileText,
  Receipt,
  MessageCircle,
  History,
  LogOut,
  Shield,
  Home,
  Calculator
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/account', label: 'Account Info', icon: User },
  { path: '/insurance-upload', label: 'Insurance Upload', icon: FileText },
  { path: '/bill-upload', label: 'Hospital Bills', icon: Receipt },
  { path: '/chat', label: 'AI Assistant', icon: MessageCircle },
  { path: '/insurance-history', label: 'Insurance History', icon: History },
  { path: '/bill-history', label: 'Bill History', icon: Shield },
  { path: '/cost-predictor', label: 'Cost Predictor', icon: Calculator },
];

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = async () => {
    setConfirmOpen(false); // Close dialog first
    try {
      await logout();
      // Navigate to login after logout completes
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      // Still navigate to login even if there's an error
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">United Health</h1>
            <p className="text-xs text-sidebar-foreground/60">Financial Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                isActive && 'sidebar-item-active'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="w-5 h-5 text-sidebar-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
        <>
          <button
            onClick={() => setConfirmOpen(true)}
            className="sidebar-item w-full text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogDescription>Are you sure you want to sign out?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)} size="sm">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  size="sm"
                >
                  Sign out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      </div>
    </aside>
  );
};

export default Sidebar;
