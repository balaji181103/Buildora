
'use client';

import {
    ChevronLeft,
    ChevronRight,
    Copy,
    CreditCard,
    File,
    Home,
    LineChart,
    ListFilter,
    MoreVertical,
    Package,
    Package2,
    PanelLeft,
    Search,
    ShoppingCart,
    Truck,
    Users2,
  } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from 'react'

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
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { Product } from "@/lib/types"

function ProductCard({ product }: { product: any }) {
    const { addItem } = useCart();
    const { toast } = useToast();

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
                    height="200"
                    src={`https://placehold.co/200x200.png`}
                    width="200"
                    data-ai-hint="product image"
                />
            </Link>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col gap-2">
            <CardTitle className="text-md">
                <Link href={`/products/${product.id}`}>
                    {product.name}
                </Link>
            </CardTitle>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Button size="sm" className="w-full" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
            </Button>
        </CardFooter>
      </Card>
    );
}

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
    const { addItem } = useCart();
    const { toast } = useToast();
    const [quantity, setQuantity] = React.useState(1);

    const product = products.find(p => p.id === params.id)
    if (!product) {
        notFound()
    }

    const handleAddToCart = () => {
        addItem(product, quantity);
        toast({
            title: "Added to Cart",
            description: `${quantity} x ${product.name} has been added to your cart.`,
        });
    }

    const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

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
                    <BreadcrumbLink asChild>
                    <Link href="/home#products">Products</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <Carousel className="w-full max-w-xl mx-auto">
                        <CarouselContent>
                            {Array.from({ length: 3 }).map((_, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                <Card>
                                    <CardContent className="flex aspect-square items-center justify-center p-0">
                                        <Image 
                                            src={`https://placehold.co/600x600.png`}
                                            alt={`${product.name} image ${index + 1}`}
                                            width={600}
                                            height={600}
                                            className="rounded-lg object-cover"
                                            data-ai-hint="product image"
                                        />
                                    </CardContent>
                                </Card>
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
                <div className="flex flex-col gap-4">
                    <h1 className="font-bold text-3xl">{product.name}</h1>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline">{product.category}</Badge>
                        <span className="text-sm text-muted-foreground">Supplier: <span className="font-medium text-foreground">{product.supplier}</span></span>
                    </div>
                    <Separator />
                    <p className="text-muted-foreground">
                        Detailed description of {product.name}. This section would highlight key features, benefits, and specifications. It is designed to give the customer all the information they need to make a purchasing decision. 
                    </p>
                    <div className="text-3xl font-bold">
                       ₹{product.price.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2">
                        {product.stock > 0 ? (
                            <Badge className="bg-green-500/20 text-green-700">In Stock</Badge>
                        ) : (
                            <Badge variant="destructive">Out of Stock</Badge>
                        )}
                         <span className="text-sm text-muted-foreground">{product.stock} units available</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                -
                            </Button>
                            <Input className="h-8 w-14 text-center" value={quantity} readOnly />
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                                +
                            </Button>
                        </div>
                        <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Related Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {relatedProducts.map(related => (
                        <ProductCard key={related.id} product={related} />
                    ))}
                </div>
            </div>
        </div>
    )
}
