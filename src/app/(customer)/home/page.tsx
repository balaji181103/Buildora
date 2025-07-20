
'use client';

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ListFilter,
  ShoppingCart,
  Calculator,
  Loader2,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
} from "lucide-react"
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { products } from "@/lib/data"
import { Product } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription, FormLabel } from "@/components/ui/form";
import { HeroSection } from "./hero-section"
import { useCart } from "@/hooks/use-cart";


function ProductCard({ product }: { product: Product }) {
    const { cart, addItem, updateQuantity, removeItem } = useCart();
    const { toast } = useToast();

    const cartItem = cart.find(item => item.product.id === product.id);

    const handleAddToCart = () => {
        addItem(product);
        toast({
            title: "Added to Cart",
            description: `${product.name} has been added to your cart.`,
        });
    }

    return (
      <Card className="flex flex-col">
        <CardHeader className="p-0 relative">
            <Link href={`/products/${product.id}`}>
                <Image
                    alt={product.name}
                    className="aspect-square w-full rounded-t-lg object-cover"
                    height="250"
                    src={`https://placehold.co/250x250.png`}
                    width="250"
                    data-ai-hint="product image"
                />
            </Link>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">{product.category}</Badge>
            <CardTitle className="text-lg">
                <Link href={`/products/${product.id}`}>
                    {product.name}
                </Link>
            </CardTitle>
            <CardDescription className="text-sm">{product.supplier}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="font-semibold text-lg">₹{product.price.toFixed(2)}</div>
             {cartItem ? (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}>
                        {cartItem.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                    </Button>
                    <span className="font-bold text-center w-8">{cartItem.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button size="sm" onClick={handleAddToCart}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                </Button>
            )}
        </CardFooter>
      </Card>
    );
}

function ProductCatalog() {
    return (
        <div id="products" className="flex flex-col gap-4 scroll-mt-20">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
                    <p className="text-muted-foreground">Browse our available products.</p>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 gap-1">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Filter
                        </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked>
                        In Stock
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>
                        By Drone
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>
                        By Truck
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                    <Select defaultValue="price_asc">
                        <SelectTrigger className="h-7 text-sm w-[140px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="popularity">Popularity</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </section>
        </div>
    )
}

export default function CustomerHomePage() {
  return (
    <div className="flex flex-col gap-8">
        <Breadcrumb>
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                <Link href="/home">Home</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>Store</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <HeroSection />

        <Separator className="my-6" />
        
        <ProductCatalog />

    </div>
  )
}
