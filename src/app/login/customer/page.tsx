
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function CustomerLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (email === 'customer' && password === 'customer') {
            toast({
                title: "Login Successful",
                description: "Welcome back! Redirecting...",
            });
            router.push('/home');
        } else {
             toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid credentials. Please try again.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
             <div className="w-full max-w-md mx-4 relative">
                <Button variant="ghost" size="icon" className="absolute top-0 left-0 -translate-y-16" onClick={() => router.push('/')}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                </Button>
                <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-8">
                    <Rocket className="w-8 h-8 text-primary" />
                    <span>Buildora</span>
                </Link>
                <form onSubmit={handleSignIn}>
                    <Card>
                        <CardHeader className="text-center">
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
