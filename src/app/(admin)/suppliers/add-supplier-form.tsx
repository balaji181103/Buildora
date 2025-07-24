
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
import { db } from '@/lib/firebase';
import type { Supplier } from '@/lib/types';


const SupplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required.'),
  contactPerson: z.string().min(1, 'Contact person is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
});

type SupplierFormValues = z.infer<typeof SupplierFormSchema>;

export function AddSupplierForm({ onSupplierAdded }: { onSupplierAdded: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierFormSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
    },
  });

  function onSubmit(values: SupplierFormValues) {
    startTransition(async () => {
        try {
            const newSupplierData: Omit<Supplier, 'id'> = {
                name: values.name,
                contactPerson: values.contactPerson,
                email: values.email,
                phone: values.phone,
                productCount: 0,
                createdAt: serverTimestamp(),
            };
            
            await addDoc(collection(db, "suppliers"), newSupplierData);
            
            toast({
                title: "Success",
                description: "Supplier added successfully.",
            });
            form.reset();
            onSupplierAdded();
        } catch (error) {
            console.error("Error adding supplier: ", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to add supplier. Please try again.",
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
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., BuildWell Materials" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Priya Sharma" {...field} />
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
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="contact@buildwell.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Adding...' : 'Add Supplier'}
        </Button>
      </form>
    </Form>
  );
}
