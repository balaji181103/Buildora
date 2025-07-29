
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
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
import { Product, Supplier } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection as firestoreCollection, onSnapshot, query, orderBy } from 'firebase/firestore';

const ProductFormSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().optional(),
  stock: z.coerce.number().min(0, 'Stock must be a positive number.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  supplier: z.string().min(1, 'Supplier is required.'),
  weight: z.coerce.number().min(0, 'Weight must be a positive number.'),
  length: z.coerce.number().min(0, 'Length must be a positive number.'),
  width: z.coerce.number().min(0, 'Width must be a positive number.'),
  height: z.coerce.number().min(0, 'Height must be a positive number.'),
  dimensionUnit: z.enum(['cm', 'inch', 'ft', 'mm']),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

export function AddProductForm({ onProductAdded }: { onProductAdded: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const q = query(firestoreCollection(db, "suppliers"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const suppliersData: Supplier[] = [];
        snapshot.forEach(doc => {
            suppliersData.push({ id: doc.id, ...doc.data() } as Supplier);
        });
        setSuppliers(suppliersData);
    });

    return () => unsubscribe();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      stock: 0,
      price: 0,
      supplier: '',
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      dimensionUnit: 'cm',
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/jpg'].includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a PNG, JPG, or WEBP image.',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('image', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    form.setValue('image', null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  async function uploadImage(file: File): Promise<{ url: string } | null> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Image upload failed. The server returned an invalid response.' }));
            throw new Error(errorData.message || 'Image upload failed');
        }

        const data = await response.json();
        return { url: data.url };
    } catch (error: any) {
        console.error('Upload Image Error:', error);
        toast({
            variant: 'destructive',
            title: 'Image Upload Error',
            description: error.message,
        });
        return null;
    }
  }

  async function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
        let finalImageUrl = '';
        if (imageFile) {
            const uploadedImage = await uploadImage(imageFile);
            if (!uploadedImage || !uploadedImage.url) {
                // Stop submission if upload fails
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: 'Could not get the image URL after upload.'
                });
                return;
            }
            finalImageUrl = uploadedImage.url;
        }

        try {
            const productData = {
                name: values.name,
                category: values.category,
                description: values.description || '',
                stock: values.stock,
                price: values.price,
                supplier: values.supplier,
                weight: values.weight,
                dimensions: {
                    length: values.length,
                    width: values.width,
                    height: values.height,
                },
                dimensionUnit: values.dimensionUnit,
                imageUrl: finalImageUrl,
                createdAt: serverTimestamp(),
            };

            await addDoc(firestoreCollection(db, "products"), productData);
            
            toast({
                title: "Product Added",
                description: `${values.name} is now in your inventory.`,
            });
            
            form.reset();
            removeImage();
            onProductAdded();

        } catch (error) {
           console.error("Error adding product: ", error);
           toast({
             variant: 'destructive',
             title: "Error",
             description: "Failed to add product. Please try again.",
           });
        }
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about the product"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
       
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className="flex items-center gap-4">
                        <FormControl>
                        <Input 
                            id="image-upload"
                            type="file" 
                            accept="image/png, image/jpeg, image/webp, image/jpg"
                            onChange={handleImageChange}
                            className="max-w-xs"
                        />
                        </FormControl>
                        {imagePreview && (
                        <div className="relative h-20 w-20 shrink-0">
                            <Image src={imagePreview} alt="Product preview" layout="fill" objectFit="contain" className="rounded-md border p-1" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 z-10 h-6 w-6" onClick={removeImage}>
                            <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        )}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>
       
        <div>
            <FormLabel>Dimensions</FormLabel>
            <div className="grid grid-cols-4 gap-4 mt-2">
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
                <FormField
                    control={form.control}
                    name="dimensionUnit"
                    render={({ field }) => (
                        <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="inch">inch</SelectItem>
                                <SelectItem value="ft">ft</SelectItem>
                                <SelectItem value="mm">mm</SelectItem>
                            </SelectContent>
                        </Select>
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
