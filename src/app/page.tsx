'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, User, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="flex flex-col items-center gap-8 text-center max-w-2xl mx-4">
        <div className="flex items-center gap-4">
          <Rocket className="h-16 w-16 text-primary" />
          <h1 className="text-5xl font-extrabold tracking-tight">Buildora</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          The future of construction supply logistics. Real-time tracking, AI-powered tools, and autonomous drone delivery.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
            <Card className="hover:shadow-lg transition-shadow">
                 <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                        <Shield className="h-6 w-6" />
                        Admin Portal
                    </CardTitle>
                    <CardDescription>
                        Manage fleet, orders, and system analytics.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                     <Button asChild className="w-full">
                        <Link href="/login/admin">Admin Login</Link>
                    </Button>
                 </CardContent>
            </Card>
             <Card className="hover:shadow-lg transition-shadow">
                 <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                        <User className="h-6 w-6" />
                        Customer Portal
                    </CardTitle>
                     <CardDescription>
                        Place orders, track deliveries, and manage your account.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/login/customer">Customer Login</Link>
                    </Button>
                 </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
