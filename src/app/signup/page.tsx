import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket } from "lucide-react";
import Link from "next/link";

export default function CustomerSignupPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
             <div className="w-full max-w-md mx-4">
                <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-8">
                    <Rocket className="w-8 h-8 text-primary" />
                    <span>Buildora</span>
                </Link>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Create an Account</CardTitle>
                        <CardDescription>Join Buildora to streamline your construction supplies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" type="text" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full">Sign Up</Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Already have an account? <Link href="/login/customer" className="underline hover:text-primary">Sign In</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
