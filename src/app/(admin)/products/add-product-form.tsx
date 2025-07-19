'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition } from 'react';

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
import { Product } from '@/lib/types';
import { products } from '@/lib/data';

const ProductFormSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  category: z.string().min(1, 'Category is required.'),
  stock: z.coerce.number().min(0, 'Stock must be a positive number.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  supplier: z.string().min(1, 'Supplier is required.'),
  weight: z.coerce.number().min(0, 'Weight must be a positive number.'),
  length: z.coerce.number().min(0, 'Length must be a positive number.'),
  width: z.coerce.number().min(0, 'Width must be a positive number.'),
  height: z.coerce.number().min(0, 'Height must be a positive number.'),
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

export function AddProductForm({ onProductAdded }: { onProductAdded: (product: Product) => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: '',
      category: '',
      stock: 0,
      price: 0,
      supplier: '',
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
    },
  });

  function onSubmit(values: ProductFormValues) {
    startTransition(() => {
        const newProduct: Product = {
            id: `PROD-${String(products.length + 1).padStart(3, '0')}`,
            name: values.name,
            category: values.category,
            stock: values.stock,
            price: values.price,
            supplier: values.supplier,
            weight: values.weight,
            dimensions: {
                length: values.length,
                width: values.width,
                height: values.height,
            }
        };
        
        onProductAdded(newProduct);
        
        toast({
            title: "Success",
            description: "Product added successfully.",
        });
        form.reset();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Power Drill Kit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tools" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., ToolMaster" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div>
            <FormLabel>Dimensions (cm)</FormLabel>
            <div className="grid grid-cols-3 gap-4 mt-2">
                <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input type="number" placeholder="Length" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input type="number" placeholder="Width" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input type="number" placeholder="Height" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Adding...' : 'Add Product'}
        </Button>
      </form>
    </Form>
  );
}
