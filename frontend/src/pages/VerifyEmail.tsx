import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Shield, Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VerifyEmail: React.FC = () => {
    const [isResending, setIsResending] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();

    // Get email from navigation state or search params
    const email = location.state?.email || searchParams.get('email') || '';

    // Handle countdown for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Check for verification token in URL (when user clicks email link)
    useEffect(() => {
        const handleEmailVerification = async () => {
            // Check for error parameters in query string (Supabase redirects with errors)
            const errorParam = searchParams.get('error');
            const errorCode = searchParams.get('error_code');
            const errorDescription = searchParams.get('error_description');

            if (errorParam || errorCode) {
                console.error('Verification error from URL:', { errorParam, errorCode, errorDescription });
                setVerificationStatus('error');

                let errorMessage = 'The verification link may be invalid or expired.';
                if (errorCode === 'otp_expired') {
                    errorMessage = 'The verification link has expired. Please request a new verification email.';
                } else if (errorDescription) {
                    errorMessage = errorDescription.replace(/\+/g, ' ');
                }

                toast({
                    title: 'Verification failed',
                    description: errorMessage,
                    variant: 'destructive',
                });
                return;
            }

            // Check if we have a hash in the URL (from email link)
            const hash = window.location.hash;

            if (!hash) return;

            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const type = hashParams.get('type');

            console.log('Hash params:', { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

            if (type === 'signup' && accessToken) {
                try {
                    // Show verifying state
                    setVerificationStatus('verifying');

                    // Exchange the tokens to verify the email
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (error) {
                        console.error('Session error:', error);
                        throw error;
                    }

                    if (data.session) {
                        console.log('Email verified successfully!', data.session.user);
                        setVerificationStatus('success');
                        toast({
                            title: 'Email verified!',
                            description: 'Your email has been successfully verified.',
                        });

                        // Clear the hash from URL
                        window.history.replaceState(null, '', window.location.pathname);

                        // Redirect to dashboard after a short delay
                        setTimeout(() => {
                            navigate('/dashboard');
                        }, 2000);
                    } else {
                        throw new Error('No session returned after verification');
                    }
                } catch (error) {
                    console.error('Verification error:', error);
                    setVerificationStatus('error');
                    toast({
                        title: 'Verification failed',
                        description: error instanceof Error ? error.message : 'The verification link may be invalid or expired.',
                        variant: 'destructive',
                    });
                }
            }
        };

        handleEmailVerification();
    }, [navigate, toast, searchParams]);

    const handleResendEmail = async () => {
        if (!email) {
            toast({
                title: 'Error',
                description: 'Email address not found. Please sign up again.',
                variant: 'destructive',
            });
            return;
        }

        setIsResending(true);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            toast({
                title: 'Email sent!',
                description: 'A new verification email has been sent to your inbox.',
            });

            // Set countdown to prevent spam
            setCountdown(60);
        } catch (error) {
            console.error('Resend error:', error);
            toast({
                title: 'Failed to resend',
                description: 'Could not resend verification email. Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsResending(false);
        }
    };

    const renderContent = () => {
        switch (verificationStatus) {
            case 'verifying':
                return (
                    <div className="text-center animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Verifying Your Email</h2>
                        <p className="text-muted-foreground text-lg mb-6">
                            Please wait a moment while we verify your email address...
                        </p>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Email Verified!</h2>
                        <p className="text-muted-foreground text-lg mb-6">
                            Your email has been successfully verified. Redirecting you to the dashboard...
                        </p>
                        <div className="flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Verification Failed</h2>
                        <p className="text-muted-foreground text-lg mb-6">
                            The verification link is invalid or has expired. Please request a new verification email.
                        </p>
                        <Button
                            onClick={handleResendEmail}
                            disabled={isResending || countdown > 0}
                            className="btn-primary h-12 px-8"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : countdown > 0 ? (
                                `Resend in ${countdown}s`
                            ) : (
                                <>
                                    Resend Verification Email
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                );

            default:
                return (
                    <div className="text-center animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Mail className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Check Your Email</h2>
                        <p className="text-muted-foreground text-lg mb-2">
                            We've sent a verification link to
                        </p>
                        {email && (
                            <p className="text-primary font-semibold text-lg mb-6">
                                {email}
                            </p>
                        )}
                        <p className="text-muted-foreground mb-8">
                            Click the link in the email to verify your account and get started.
                        </p>

                        <div className="bg-muted/50 rounded-lg p-6 mb-8">
                            <h3 className="font-semibold text-foreground mb-3">Didn't receive the email?</h3>
                            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Check your spam or junk folder</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Make sure you entered the correct email address</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Wait a few minutes for the email to arrive</span>
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleResendEmail}
                            disabled={isResending || countdown > 0}
                            variant="outline"
                            className="h-12 px-8 mb-4"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : countdown > 0 ? (
                                `Resend in ${countdown}s`
                            ) : (
                                'Resend Verification Email'
                            )}
                        </Button>

                        <div className="mt-8 pt-6 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Wrong email address?{' '}
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="text-primary font-semibold hover:underline"
                                >
                                    Sign up again
                                </button>
                            </p>
                        </div>
                    </div>
                );
        }
    };

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
                            Almost There!
                        </h2>
                        <p className="text-lg text-primary-foreground/80 leading-relaxed">
                            Just one more step to secure your account and start managing your healthcare finances with confidence.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Verification Content */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-2xl">
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

                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
