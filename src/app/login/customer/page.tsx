
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
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Customer } from '@/lib/types';

export default function CustomerLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
            
            // In a real app, use a secure password hashing and comparison method.
            // This is for demonstration purposes only.
            if (customerData.password !== password) {
                 throw new Error("Invalid credentials.");
            }
            
            // Store user ID in localStorage to simulate a session
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

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
             <div className="w-full max-w-md mx-4">
                <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-8">
                    <Rocket className="w-8 h-8 text-primary" />
                    <span>Buildora</span>
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
                                    <Link href="#" className="text-xs underline hover:text-primary">
                                        Forgot password?
                                    </Link>
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
