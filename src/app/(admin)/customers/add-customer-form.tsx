'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTransition } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-client';
import type { Customer } from '@/lib/types';


const CustomerFormSchema = z.object({
  name: z.string().min(1, 'Customer name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

type CustomerFormValues = z.infer<typeof CustomerFormSchema>;

export function AddCustomerForm({ onCustomerAdded }: { onCustomerAdded: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  function onSubmit(values: CustomerFormValues) {
    startTransition(async () => {
        try {
            const newCustomerData: Omit<Customer, 'id'> = {
                name: values.name,
                email: values.email,
                phone: values.phone,
                password: values.password, // In a real app, use Firebase Auth & hash passwords.
                status: 'Active',
                loyaltyPoints: 0,
                orderCount: 0,
                addresses: [],
                createdAt: serverTimestamp(),
            };
            
            await addDoc(collection(db, "customers"), newCustomerData);
            
            toast({
                title: "Success",
                description: "Customer added successfully.",
            });
            form.reset();
            onCustomerAdded();
        } catch (error) {
            console.error("Error adding customer: ", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to add customer. Please try again.",
            });
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rohan Sharma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="rohan@example.com" {...field} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Set Temporary Password</FormLabel>
                <FormControl>
                    <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Adding...' : 'Add Customer'}
        </Button>
      </form>
    </Form>
  );
}
