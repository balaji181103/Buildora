
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, limit, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Customer } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CustomerLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // State for Forgot Password flow
    const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState<'enterPhone' | 'resetPassword'>('enterPhone');
    const [forgotPhone, setForgotPhone] = useState('');
    const [customerToResetId, setCustomerToResetId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const q = query(
                collection(db, "customers"), 
                where("email", "==", email),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("Invalid credentials.");
            }

            const customerDoc = querySnapshot.docs[0];
            const customerData = customerDoc.data() as Customer;
            
            if (customerData.password !== password) {
                 throw new Error("Invalid credentials.");
            }
            
            localStorage.setItem('loggedInCustomerId', customerDoc.id);

            toast({
                title: "Login Successful",
                description: "Welcome back! Redirecting...",
            });
            router.push('/home');

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message || "Invalid credentials. Please try again.",
            });
            setIsLoading(false);
        }
    };

    const handleVerifyPhone = async () => {
        if (!forgotPhone) {
            toast({ variant: "destructive", title: "Phone number is required." });
            return;
        }
        setIsCheckingPhone(true);
        try {
            const q = query(collection(db, "customers"), where("phone", "==", forgotPhone), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("No account found with this phone number.");
            }

            const customerDoc = querySnapshot.docs[0];
            setCustomerToResetId(customerDoc.id);
            setForgotStep('resetPassword');
            toast({ title: "Phone Number Verified", description: "You can now reset your password." });

        } catch (error: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: error.message });
        } finally {
            setIsCheckingPhone(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Password must be at least 6 characters long."});
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast({ variant: "destructive", title: "Passwords do not match." });
            return;
        }
        if (!customerToResetId) {
             toast({ variant: "destructive", title: "An error occurred. Please start over." });
            return;
        }

        setIsResettingPassword(true);
        try {
            const customerRef = doc(db, 'customers', customerToResetId);
            await writeBatch(db).update(customerRef, { password: newPassword }).commit();

            toast({ title: "Password Reset Successfully", description: "Please log in with your new password." });
            closeAndResetDialog();

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: "Could not reset password. Please try again." });
        } finally {
            setIsResettingPassword(false);
        }
    };
    
    const closeAndResetDialog = () => {
        setIsForgotDialogOpen(false);
        setForgotStep('enterPhone');
        setForgotPhone('');
        setNewPassword('');
        setConfirmNewPassword('');
        setCustomerToResetId(null);
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
             <div className="w-full max-w-md mx-4">
                <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-8">
                    <Rocket className="w-8 h-8 text-primary" />
                    <span>Smart Inventory</span>
                </Link>
                <form onSubmit={handleSignIn}>
                    <Card className="relative">
                        <CardHeader className="text-center">
                            <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.push('/')}>
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                            <CardTitle>Customer Login</CardTitle>
                            <CardDescription>Welcome back! Please sign in to your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    required 
                                    disabled={isLoading}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Dialog open={isForgotDialogOpen} onOpenChange={(isOpen) => {
                                        if (!isOpen) closeAndResetDialog();
                                        else setIsForgotDialogOpen(true);
                                    }}>
                                        <DialogTrigger asChild>
                                            <button type="button" className="text-xs underline hover:text-primary">
                                                Forgot password?
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            {forgotStep === 'enterPhone' && (
                                                <>
                                                    <DialogHeader>
                                                        <DialogTitle>Forgot Password</DialogTitle>
                                                        <DialogDescription>Enter your phone number to verify your account.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="forgot-phone">Phone Number</Label>
                                                            <Input 
                                                                id="forgot-phone" 
                                                                type="tel"
                                                                placeholder="+91 98765 43210"
                                                                value={forgotPhone}
                                                                onChange={(e) => setForgotPhone(e.target.value)}
                                                                disabled={isCheckingPhone}
                                                            />
                                                        </div>
                                                        <Button onClick={handleVerifyPhone} disabled={isCheckingPhone} className="w-full">
                                                            {isCheckingPhone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Verify
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                            {forgotStep === 'resetPassword' && (
                                                 <>
                                                    <DialogHeader>
                                                        <DialogTitle>Reset Your Password</DialogTitle>
                                                        <DialogDescription>Enter and confirm your new password below.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                         <div className="space-y-2">
                                                            <Label htmlFor="new-password">New Password</Label>
                                                            <Input 
                                                                id="new-password" 
                                                                type="password"
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                disabled={isResettingPassword}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                                                            <Input 
                                                                id="confirm-new-password" 
                                                                type="password"
                                                                value={confirmNewPassword}
                                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                                disabled={isResettingPassword}
                                                            />
                                                        </div>
                                                        <Button onClick={handleResetPassword} disabled={isResettingPassword} className="w-full">
                                                            {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Reset Password
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    required 
                                    disabled={isLoading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Don't have an account? <Link href="/signup" className="underline hover:text-primary">Sign Up</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
