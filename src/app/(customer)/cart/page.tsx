
'use client';

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
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
  Trash2,
  Truck,
  Users2,
  Minus,
  Plus,
} from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { useCart } from "@/hooks/use-cart"

export default function CartPage() {
    const { cart, updateQuantity, removeItem } = useCart();
    const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

    React.useEffect(() => {
        // Initialize selected items with all items in the cart
        setSelectedItems(cart.map(item => item.product.id));
    }, [cart]);
    
    const subtotal = React.useMemo(() => {
        return cart
            .filter(item => selectedItems.includes(item.product.id))
            .reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    }, [cart, selectedItems]);

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        updateQuantity(productId, newQuantity);
    }

    const handleSelectItem = (productId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedItems(prev => [...prev, productId]);
        } else {
            setSelectedItems(prev => prev.filter(id => id !== productId));
        }
    }

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            setSelectedItems(cart.map(item => item.product.id));
        } else {
            setSelectedItems([]);
        }
    }

    const isAllSelected = cart.length > 0 && selectedItems.length === cart.length;
  
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
                <BreadcrumbPage>Shopping Cart</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Your Cart</CardTitle>
                            <CardDescription>You have {cart.length} item(s) in your cart. Selected {selectedItems.length}.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => cart.forEach(item => removeItem(item.product.id))} disabled={cart.length === 0}>
                            Clear Cart
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        aria-label="Select all items"
                                    />
                                </TableHead>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Image</span>
                                </TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                            Your cart is empty. <Link href="/home#products" className="text-primary underline">Continue shopping</Link>.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cart.map(({product, quantity}) => (
                                    <TableRow key={product.id} data-state={selectedItems.includes(product.id) ? 'selected' : ''}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedItems.includes(product.id)}
                                                onCheckedChange={(checked) => handleSelectItem(product.id, !!checked)}
                                                aria-label={`Select ${product.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                        <Image
                                            alt={product.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src="https://placehold.co/64x64.png"
                                            width="64"
                                            data-ai-hint="product image"
                                        />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <p>{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.id}</p>
                                        </TableCell>
                                        <TableCell>₹{product.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                             <div className="flex items-center gap-2">
                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity - 1)}>
                                                    {quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                                                </Button>
                                                <Input className="h-8 w-12 text-center font-bold" value={quantity} readOnly />
                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">₹{(product.price * quantity).toFixed(2)}</TableCell>
                                    </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>TBD</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Taxes</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" disabled={selectedItems.length === 0}>Proceed to Checkout</Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Apply Coupon</CardTitle>
                        <CardDescription>Enter your coupon code to apply a discount.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                       <Input placeholder="Coupon Code" />
                       <Button>Apply</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}
