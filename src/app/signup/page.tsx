
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from '@/lib/firebase-client';
import type { Customer } from '@/lib/types';


const SignupFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof SignupFormSchema>;

export default function CustomerSignupPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(SignupFormSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
    });

    function onSubmit(values: SignupFormValues) {
        startTransition(async () => {
            try {
                const newCustomerData: Omit<Customer, 'id'> = {
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    password: values.password, // In a real app, use Firebase Auth. Do not store plain text passwords.
                    status: 'Active',
                    loyaltyPoints: 0,
                    orderCount: 0,
                    addresses: [],
                    createdAt: serverTimestamp(),
                };
                
                await addDoc(collection(db, "customers"), newCustomerData);

                toast({
                    title: "Account Created!",
                    description: "You have successfully signed up. Please log in.",
                });
                router.push('/login/customer');
            } catch (error) {
                console.error("Error creating customer account: ", error);
                toast({
                    variant: 'destructive',
                    title: "Signup Failed",
                    description: "There was an error creating your account. Please try again.",
                });
            }
        });
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted py-12">
             <div className="w-full max-w-md mx-4">
                <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-8">
                    <Rocket className="w-8 h-8 text-primary" />
                    <span>Buildora</span>
                </Link>
                <Card className="relative">
                    <CardHeader className="text-center">
                        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.push('/')}>
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <CardTitle>Create an Account</CardTitle>
                        <CardDescription>Join Buildora to streamline your construction supplies.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Full Name</Label>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g., Priya Sharma" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Email</Label>
                                            <FormControl>
                                                <Input type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Phone Number</Label>
                                            <FormControl>
                                                <Input type="tel" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Password</Label>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Confirm Password</Label>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? 'Signing Up...' : 'Sign Up'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <p className="text-xs text-muted-foreground text-center">
                            Already have an account? <Link href="/login/customer" className="underline hover:text-primary">Sign In</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
