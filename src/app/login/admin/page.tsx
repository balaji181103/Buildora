
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
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

        if (email === 'admin@smartinventory.com' && password === 'admin') {
            toast({
                title: "Login Successful",
                description: "Redirecting to your dashboard...",
            });
            router.push('/dashboard');
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid email or password. Please try again.",
            });
            setIsLoading(false);
        }
    };

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
                            <CardTitle>Admin Login</CardTitle>
                            <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Button>
                             <p className="text-xs text-muted-foreground text-center">
                                Not an admin? <Link href="/login/customer" className="underline hover:text-primary">Customer Login</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
