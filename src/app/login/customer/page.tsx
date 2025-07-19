import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket } from "lucide-react";
import Link from "next/link";

export default function CustomerLoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
             <div className="w-full max-w-md mx-4">
                <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-8">
                    <Rocket className="w-8 h-8 text-primary" />
                    <span>Buildora</span>
                </Link>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Customer Login</CardTitle>
                        <CardDescription>Welcome back! Please sign in to your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="#" className="text-xs underline hover:text-primary">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input id="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full">Sign In</Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Don't have an account? <Link href="#" className="underline hover:text-primary">Sign Up</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
