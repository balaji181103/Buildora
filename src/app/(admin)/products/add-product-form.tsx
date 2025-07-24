
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
import { ImagePlus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { db, storage } from '@/lib/firebase'; // Import db and storage from your Firebase config

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
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

export function AddProductForm({ onProductAdded }: { onProductAdded: (product: Product) => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
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

  async function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
      try {
        // Step 1: Create the product document in Firestore without the imageUrl
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
          imageUrl: '', // Initially empty
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "products"), productData);
        
        // Step 2: Optimistically update the UI
        onProductAdded({ id: docRef.id, ...productData });
        toast({
          title: "Product Added",
          description: `${values.name} is now in your inventory. Image is being uploaded.`,
        });
        form.reset();
        removeImage();

        // Step 3: Upload image in the background
        if (imageFile) {
          const imageRef = ref(storage, `product_images/${docRef.id}_${imageFile.name}`);
          await uploadBytes(imageRef, imageFile);
          const imageUrl = await getDownloadURL(imageRef);

          // Step 4: Update the document with the imageUrl
          await updateDoc(doc(db, "products", docRef.id), { imageUrl: imageUrl });
          console.log("Image URL updated for product:", docRef.id);
        }

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
                    <FormControl>
                        <Input placeholder="e.g., ToolMaster" {...field} />
                    </FormControl>
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
                            accept="image/*"
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
