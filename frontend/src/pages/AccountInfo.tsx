import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Shield, Edit2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AccountInfo: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    planType: user?.planType || 'Standard',
  });

  // Sync state when user context loads/updates
  React.useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        planType: user.planType || 'Standard',
      });
    }
  }, [user, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateUser(formData);
      
      if (success) {
        setIsEditing(false);
        toast({
          title: 'Profile Updated',
          description: 'Your account information has been saved successfully.',
        });
      } else {
        toast({
          title: 'Update Failed',
          description: 'Could not update profile. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: 'Update Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const infoFields = [
    { icon: User, label: 'Full Name', value: `${formData.firstName} ${formData.lastName}`, fields: ['firstName', 'lastName'] },
    { icon: Mail, label: 'Email Address', value: formData.email, field: 'email' },
    { icon: Phone, label: 'Phone Number', value: formData.phone, field: 'phone' },
    { icon: MapPin, label: 'Address', value: formData.address, field: 'address' },
    { icon: Calendar, label: 'Date of Birth', value: formData.dateOfBirth, field: 'dateOfBirth' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Information</h1>
          <p className="text-muted-foreground mt-1">Manage your personal details and preferences</p>
        </div>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={isEditing ? 'btn-primary' : ''}
          variant={isEditing ? 'default' : 'outline'}
          disabled={isSaving}
        >
          {isEditing ? (
            <>
              {isSaving ? (
                <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="card-elevated lg:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="w-24 h-24 rounded-full gradient-primary mx-auto flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">{user?.planType}</span>
              </div>
              <p className="text-sm text-muted-foreground">Member since 2024</p>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="h-12 input-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="h-12 input-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 input-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-12 input-focus"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="h-12 input-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="h-12 input-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planType">Plan Type</Label>
                  <select
                    id="planType"
                    name="planType"
                    value={formData.planType}
                    onChange={(e) => setFormData(prev => ({ ...prev, planType: e.target.value }))}
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 input-focus"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium Gold">Premium Gold</option>
                    <option value="Platinum Elite">Platinum Elite</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {infoFields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <field.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{field.label}</p>
                      <p className="font-medium text-foreground">{field.value || 'Not provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membership Card */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Membership Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-secondary/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Member ID</p>
              <p className="font-semibold text-foreground mt-1">{user?.memberId}</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Plan Type</p>
              <p className="font-semibold text-foreground mt-1">{user?.planType}</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold text-success mt-1">Active</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl">
              <p className="text-sm text-muted-foreground">Renewal Date</p>
              <p className="font-semibold text-foreground mt-1">Dec 31, 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountInfo;
