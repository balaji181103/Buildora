'use client';

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CreditCard, Loader2, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase-client";
import { collection, doc, runTransaction, serverTimestamp, onSnapshot } from "firebase/firestore";
import type { Order, CartItem, Address } from "@/lib/types";
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CheckoutOrderDetails {
    cart: CartItem[];
    customerId: string;
    customerName: string;
    shippingAddress: Address;
    subtotal: number;
    shippingCost: number;
    taxes: number;
    total: number;
    deliveryMethod: string;
}

const TIMER_DURATION = 60; // 60 seconds

export default function PaymentPage() {
    const { clearCart } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);
    const [orderDetails, setOrderDetails] = React.useState<CheckoutOrderDetails | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [paymentQrUrl, setPaymentQrUrl] = React.useState<string | null>(null);

    const [accordionValue, setAccordionValue] = React.useState('card');
    const [timer, setTimer] = React.useState(TIMER_DURATION);
    
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (accordionValue === 'qr-code' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else if (timer === 0 && accordionValue === 'qr-code') {
            setAccordionValue(''); // Close accordion
        }

        return () => clearInterval(interval);
    }, [accordionValue, timer]);

    const handleAccordionChange = (value: string) => {
        setAccordionValue(value);
        if (value === 'qr-code') {
            setTimer(TIMER_DURATION); // Reset timer when QR code is opened
        }
    }


    React.useEffect(() => {
        const storedDetails = localStorage.getItem('checkoutOrderDetails');
        if (storedDetails) {
            setOrderDetails(JSON.parse(storedDetails));
        } else {
            // If no details are found, maybe redirect back to cart
            router.push('/cart');
        }
        setLoading(false);
    }, [router]);

    React.useEffect(() => {
        const docRef = doc(db, 'siteContent', 'paymentQr');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().paymentQrUrl) {
            setPaymentQrUrl(docSnap.data().paymentQrUrl);
          } else {
            setPaymentQrUrl('https://placehold.co/200x200.png');
          }
        });
        return () => unsubscribe();
    }, []);


    const handlePlaceOrder = async () => {
        if (!orderDetails) {
            toast({ variant: 'destructive', title: 'Order details are missing.' });
            return;
        }

        setIsPlacingOrder(true);
        const { cart, customerId, customerName, shippingAddress, total } = orderDetails;
        
        let finalOrderId: string | null = null;
        try {
            await runTransaction(db, async (transaction) => {
                const counterRef = doc(db, 'counters', 'orders');
                const counterDoc = await transaction.get(counterRef);

                let nextOrderId = 1;
                if (counterDoc.exists()) {
                    nextOrderId = counterDoc.data().current + 1;
                }
                finalOrderId = String(nextOrderId);

                // READ operations first
                const productRefs = cart.map(item => doc(db, "products", item.product.id));
                const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

                for (let i = 0; i < productDocs.length; i++) {
                    const productDoc = productDocs[i];
                    const cartItem = cart[i];
                    if (!productDoc.exists()) {
                        throw new Error(`Product '${cartItem.product.name}' not found!`);
                    }
                    const currentStock = productDoc.data().stock;
                    if (currentStock < cartItem.quantity) {
                         throw new Error(`Not enough stock for ${cartItem.product.name}. Only ${currentStock} available.`);
                    }
                }

                // WRITE operations last
                const newOrderRef = doc(db, "orders", finalOrderId);
                const orderItems = cart.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price
                }));
                
                const newOrder: Omit<Order, 'id' | 'date'> & { date: any } = {
                    customerName: customerName,
                    customerId: customerId,
                    status: 'Processing',
                    date: serverTimestamp(),
                    total,
                    items: orderItems,
                    shippingAddress: shippingAddress,
                };
                transaction.set(newOrderRef, newOrder);
                transaction.set(counterRef, { current: nextOrderId }, { merge: true });

                for (let i = 0; i < productDocs.length; i++) {
                    const productDoc = productDocs[i];
                    const cartItem = cart[i];
                    const newStock = productDoc.data().stock - cartItem.quantity;
                    transaction.update(productDoc.ref, { stock: newStock });
                }

                const customerRef = doc(db, "customers", customerId);
                const customerDoc = await transaction.get(customerRef);
                const currentOrderCount = customerDoc.data()?.orderCount || 0;
                transaction.update(customerRef, { orderCount: currentOrderCount + 1 });
            });
            
            toast({
                title: "Order Placed!",
                description: `Your order #${finalOrderId} has been successfully placed.`,
            });
            clearCart();
            localStorage.removeItem('checkoutOrderDetails');
            router.push(`/checkout/success?orderId=${finalOrderId}`);

        } catch (error: any) {
            console.error("Transaction failed: ", error);
            toast({
                variant: 'destructive',
                title: "Order Failed",
                description: error.message || "There was an issue placing your order. Please try again.",
            });
        } finally {
            setIsPlacingOrder(false);
        }
    }

    const handlePaymentAction = () => {
        if (accordionValue === 'qr-code') {
            handlePlaceOrder();
        } else {
            handleAccordionChange('qr-code');
        }
    };

    if (loading || !orderDetails) {
        return (
             <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const { cart, subtotal, shippingCost, taxes, total } = orderDetails;

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
                    <Link href="/cart">Cart</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                     <BreadcrumbLink asChild>
                    <Link href="/checkout">Checkout</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Payment</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                            <CardDescription>Choose your preferred payment method.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="single" collapsible value={accordionValue} onValueChange={handleAccordionChange}>
                                <AccordionItem value="card">
                                    <AccordionTrigger className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Credit/Debit Card
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="card-number">Card Number</Label>
                                            <Input id="card-number" placeholder="1234 5678 9012 3456" />
                                        </div>
                                         <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label htmlFor="expiry">Expiration Date</Label>
                                                <Input id="expiry" placeholder="MM / YY" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvc">CVC</Label>
                                                <Input id="cvc" placeholder="123" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="card-name">Name on Card</Label>
                                            <Input id="card-name" placeholder="Priya Sharma" />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="upi-apps">
                                    <AccordionTrigger className="font-semibold">
                                        <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.533c-5.43.54-9.43-3.46-9.973-8.893A9.453 9.453 0 0 1 11.56 1.57a9.453 9.453 0 0 1 10.873 10.873 9.453 9.453 0 0 1-10.433 8.09zM8 8l8 8"/><path d="m8 16 8-8"/></svg>
                                            UPI Apps
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 grid grid-cols-3 gap-4">
                                        <Button variant="outline">GPay</Button>
                                        <Button variant="outline">PhonePe</Button>
                                        <Button variant="outline">Paytm</Button>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="upi-id">
                                    <AccordionTrigger className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="m22 12-4-4 4-4"/><path d="M2 12h16"/></svg>
                                            Enter UPI ID
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-2">
                                        <Label htmlFor="upi-id">Your UPI ID</Label>
                                        <Input id="upi-id" placeholder="yourname@bank" />
                                        <Button>Verify & Pay</Button>
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="qr-code">
                                    <AccordionTrigger className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <QrCode className="h-5 w-5" />
                                            Scan QR Code
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 flex flex-col items-center gap-4">
                                        <p className="text-sm text-muted-foreground">Scan the QR code with your preferred UPI app.</p>
                                        {paymentQrUrl ? (
                                            <Image 
                                                src={paymentQrUrl} 
                                                width={200} 
                                                height={200} 
                                                alt="QR Code for payment" 
                                                data-ai-hint="qr code"
                                            />
                                        ) : (
                                            <div className="h-[200px] w-[200px] bg-muted animate-pulse rounded-md flex items-center justify-center">
                                                <Loader2 className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="w-full max-w-xs space-y-2">
                                            <Progress value={(timer / TIMER_DURATION) * 100} />
                                            <p className="text-xs text-muted-foreground text-center">
                                                QR code expires in {timer} seconds
                                            </p>
                                            <p className="font-semibold text-center pt-2">
                                                Pay: ₹{total.toFixed(2)}
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="relative h-12 w-12">
                                                <Image src={item.product.imageUrl || "https://placehold.co/64x64.png"} alt={item.product.name} fill className="rounded-md object-cover" data-ai-hint="product image"/>
                                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{item.quantity}</span>
                                            </div>
                                            <span className="truncate max-w-28">{item.product.name}</span>
                                        </div>
                                        <span className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxes (18%)</span>
                                    <span>₹{taxes.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Button size="lg" className="w-full" onClick={handlePaymentAction} disabled={isPlacingOrder}>
                        {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isPlacingOrder 
                            ? 'Placing Order...' 
                            : accordionValue === 'qr-code'
                            ? 'Confirm Payment After Scanning'
                            : 'Pay Now'
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}
