

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
    Minus,
    Plus,
    Trash2,
    Loader2,
    Star
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
import { notFound, useParams } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { Product } from "@/lib/types"
import { db } from "@/lib/firebase-client"
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
                    height="200"
                    src={product.imageUrl || `https://placehold.co/200x200.png`}
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
             {cartItem ? (
                <div className="flex items-center gap-1 w-full">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}>
                         {cartItem.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                    </Button>
                    <span className="font-bold text-center flex-1">{cartItem.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button size="sm" className="w-full" onClick={handleAddToCart}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                </Button>
            )}
        </CardFooter>
      </Card>
    );
}

export default function ProductDetailsPage() {
    const { cart, addItem, updateQuantity } = useCart();
    const { toast } = useToast();
    const params = useParams();
    const id = params.id as string;
    
    const [product, setProduct] = React.useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);

    const cartItem = cart.find(item => item.product.id === id);
    const [quantity, setQuantity] = React.useState(cartItem ? cartItem.quantity : 1);
    
    React.useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const productData = { id: docSnap.id, ...docSnap.data() } as Product;
                    setProduct(productData);

                    // Fetch related products
                    if (productData.category) {
                        const q = query(
                            collection(db, "products"),
                            where("category", "==", productData.category),
                            where("__name__", "!=", id),
                            limit(4)
                        );
                        const querySnapshot = await getDocs(q);
                        const fetchedRelatedProducts: Product[] = [];
                        querySnapshot.forEach((doc) => {
                            fetchedRelatedProducts.push({ id: doc.id, ...doc.data() } as Product);
                        });
                        setRelatedProducts(fetchedRelatedProducts);
                    }
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    React.useEffect(() => {
        if (cartItem) {
            setQuantity(cartItem.quantity);
        } else {
            setQuantity(1);
        }
    }, [cartItem]);

    const handleAddToCart = () => {
        if (!product) return;
        addItem(product, quantity);
        toast({
            title: "Added to Cart",
            description: `${quantity} x ${product.name} has been added to your cart.`,
        });
    }

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity > 0) {
            setQuantity(newQuantity);
            if(cartItem) {
                updateQuantity(id, newQuantity);
            }
        } else if (cartItem) {
             updateQuantity(id, 0); // This will remove the item
        }
    }

    if (loading) {
        return (
             <div className="flex flex-col gap-8">
                <Skeleton className="h-6 w-1/2" />
                <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="aspect-square w-full" />
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-9 w-3/4" />
                        <Skeleton className="h-5 w-1/4" />
                        <Separator />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-9 w-1/3" />
                        <Skeleton className="h-6 w-1/2" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-12 flex-1" />
                        </div>
                    </div>
                </div>
                 <div>
                    <Skeleton className="h-8 w-1/4 mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <Card key={i}>
                                <Skeleton className="aspect-square w-full rounded-t-lg" />
                                <CardContent className="p-4 space-y-2">
                                    <Skeleton className="h-5 w-4/5" />
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Skeleton className="h-9 w-full" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    if (!product) {
        return notFound();
    }

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
                                            src={product.imageUrl || `https://placehold.co/600x600.png`}
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
                        {product.description || 'No description available.'}
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
                            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity - 1)}>
                                {quantity === 1 && cartItem ? <Trash2 className="h-5 w-5 text-destructive" /> : <Minus className="h-5 w-5" />}
                            </Button>
                            <Input className="h-10 w-16 text-center text-lg font-bold" value={quantity} readOnly />
                            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity + 1)}>
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        {!cartItem && (
                             <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to Cart
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <Separator className="my-4" />

            {relatedProducts.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Related Products</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map(related => (
                            <ProductCard key={related.id} product={related} />
                        ))}
                    </div>
                </div>
            )}
            
        </div>
    )
}
