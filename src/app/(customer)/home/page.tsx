
'use client';

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus
} from "lucide-react"

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
import { Product } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast";
import { HeroSection } from "./hero-section"
import { useCart } from "@/hooks/use-cart";
import { MaterialEstimator } from "./material-estimator"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import { Skeleton } from "@/components/ui/skeleton"


function ProductCard({ product }: { product: Product }) {
    const { cart, addItem, updateQuantity } = useCart();
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
                    src={product.imageUrl || `https://placehold.co/250x250.png`}
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
        <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-4">
            <div className="font-semibold text-lg self-start">₹{product.price.toFixed(2)}</div>
             {cartItem ? (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}>
                        {cartItem.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                    </Button>
                    <span className="font-bold text-center flex-1">{cartItem.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button size="sm" onClick={handleAddToCart} className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                </Button>
            )}
        </CardFooter>
      </Card>
    );
}

function ProductCatalog() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const productsData: Product[] = [];
                querySnapshot.forEach((doc) => {
                    productsData.push({ id: doc.id, ...doc.data() } as Product);
                });
                setProducts(productsData);
            } catch (error) {
                console.error("Error fetching products: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div id="products" className="flex flex-col gap-4 scroll-mt-20">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
                    <p className="text-muted-foreground">Browse our available products.</p>
                </div>
            </div>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <Skeleton className="aspect-square w-full rounded-t-lg" />
                            <CardContent className="p-4 space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-5 w-4/5" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-4">
                                <Skeleton className="h-8 w-1/3" />
                                <Skeleton className="h-9 w-full" />
                            </CardFooter>
                        </Card>
                    ))
                ) : products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-muted-foreground">No products found.</p>
                )}
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

        <MaterialEstimator />
        
        <Separator className="my-6" />

        <ProductCatalog />

    </div>
  )
}
