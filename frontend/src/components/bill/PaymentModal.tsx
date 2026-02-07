import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Bill } from '@/contexts/DatabaseContext';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
    onPaymentComplete: (billId: string) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    bill,
    onPaymentComplete,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setIsLoading(false);
            setIsSuccess(false);
            setError(null);
            setCardNumber('');
            setExpiry('');
            setCvc('');
            setName('');
        }
    }, [isOpen]);

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const handlePayment = async () => {
        if (!bill) return;
        
        // Basic validation
        if (cardNumber.length < 16 || expiry.length < 4 || cvc.length < 3 || name.length < 3) {
            setError("Please fill in all card details correctly.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Success!
            setIsSuccess(true);
            
            // Wait for animation
            setTimeout(async () => {
                await onPaymentComplete(bill.id);
                onClose();
            }, 1500);
            
        } catch (err) {
            setError("Payment failed. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Secure Payment
                    </DialogTitle>
                    <DialogDescription>
                        Paying bill for <span className="font-semibold text-foreground">{bill?.hospitalName}</span>
                    </DialogDescription>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-green-700">Payment Successful!</h3>
                        <p className="text-muted-foreground">Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                         <div className="p-4 rounded-lg bg-secondary/50 flex justify-between items-center mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Amount Due</p>
                                <p className="text-2xl font-bold text-primary">${bill?.amount.toLocaleString()}</p>
                            </div>
                            <Badge variant="outline" className="bg-background">
                                <Lock className="w-3 h-3 mr-1" /> SSL Encrypted
                            </Badge>
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Cardholder Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="John Doe" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="card">Card Number</Label>
                                <div className="relative">
                                    <Input 
                                        id="card" 
                                        placeholder="0000 0000 0000 0000" 
                                        maxLength={19}
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        disabled={isLoading}
                                        className="pl-10 font-mono"
                                    />
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry Date</Label>
                                    <Input 
                                        id="expiry" 
                                        placeholder="MM/YY" 
                                        maxLength={5}
                                        value={expiry}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/[^0-9]/g, '');
                                            if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                                            setExpiry(v);
                                        }}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input 
                                        id="cvc" 
                                        placeholder="123" 
                                        maxLength={3} 
                                        type="password"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between items-center">
                    {!isSuccess && (
                        <>
                            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handlePayment} 
                                disabled={isLoading}
                                className="w-full sm:w-auto btn-primary relative min-w-[120px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay $${bill?.amount.toLocaleString()}`
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;
