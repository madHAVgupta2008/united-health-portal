import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();

    // Check if we have a valid recovery token
    useEffect(() => {
        const checkRecoveryToken = async () => {
            const hash = window.location.hash;
            if (!hash) {
                toast({
                    title: 'Invalid link',
                    description: 'This password reset link is invalid. Please request a new one.',
                    variant: 'destructive',
                });
                setTimeout(() => navigate('/forgot-password'), 2000);
                return;
            }

            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const type = hashParams.get('type');

            if (type !== 'recovery' || !accessToken) {
                toast({
                    title: 'Invalid link',
                    description: 'This password reset link is invalid. Please request a new one.',
                    variant: 'destructive',
                });
                setTimeout(() => navigate('/forgot-password'), 2000);
            }
        };

        checkRecoveryToken();
    }, [navigate, toast]);

    const validatePassword = (): boolean => {
        setPasswordError('');

        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return false;
        }

        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) {
            toast({
                title: 'Validation error',
                description: passwordError,
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setResetStatus('success');
            toast({
                title: 'Password reset successful',
                description: 'Your password has been updated. Redirecting to login...',
            });

            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);

            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('Password reset error:', error);
            setResetStatus('error');
            toast({
                title: 'Reset failed',
                description: error instanceof Error ? error.message : 'Failed to reset password. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (resetStatus === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md text-center animate-slide-up">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Password Reset!</h2>
                    <p className="text-muted-foreground text-lg mb-6">
                        Your password has been successfully reset. Redirecting you to login...
                    </p>
                    <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                </div>
            </div>
        );
    }

    if (resetStatus === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md text-center animate-slide-up">
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Reset Failed</h2>
                    <p className="text-muted-foreground text-lg mb-6">
                        Failed to reset your password. The link may have expired.
                    </p>
                    <Button
                        onClick={() => navigate('/forgot-password')}
                        className="btn-primary h-12 px-8"
                    >
                        Request New Link
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Shield className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">United Health</h1>
                            <p className="text-primary-foreground/70">Financial Portal</p>
                        </div>
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-4xl font-bold mb-6 leading-tight">
                            Secure Your Account
                        </h2>
                        <p className="text-lg text-primary-foreground/80 leading-relaxed">
                            Create a strong password to protect your healthcare financial information.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Reset Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md animate-slide-up">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                            <Shield className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">United Health</h1>
                            <p className="text-xs text-muted-foreground">Financial Portal</p>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-foreground mb-2">Reset Password</h2>
                        <p className="text-muted-foreground">
                            Enter your new password below
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                    className="pl-10 pr-10 h-12 input-focus"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                    className="pl-10 pr-10 h-12 input-focus"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {passwordError && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                <p className="text-sm text-destructive">{passwordError}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>

                        {/* Back to Login */}
                        <div className="text-center pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
