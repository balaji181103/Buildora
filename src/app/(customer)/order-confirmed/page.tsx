
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, FileText, ShoppingBag, ArrowRight, Package, Loader2, Home, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default function OrderConfirmedPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { toast } = useToast();
    const [order, setOrder] = React.useState<Order | null>(null);
    const [loading, setLoading] = React.useState(true);


    React.useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        const fetchOrder = async () => {
            try {
                const docRef = doc(db, "orders", orderId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                     const data = docSnap.data();
                    setOrder({ 
                        id: docSnap.id,
                        ...data,
                        date: data.date.toDate() 
                    } as Order);
                }
            } catch (error) {
                console.error("Error fetching order:", error);
                 toast({
                    variant: 'destructive',
                    title: "Could not fetch order details.",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, toast]);


    const handleDownloadInvoice = () => {
        toast({
            title: "Coming Soon!",
            description: "PDF invoice generation is not yet implemented.",
        });
    }
    
    if (loading) {
        return (
             <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p className="text-muted-foreground">We couldn't find the details for your recent order.</p>
                <Button asChild>
                    <Link href="/my-orders">View Your Orders</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="mx-auto grid w-full max-w-4xl gap-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h1 className="text-3xl font-bold tracking-tight">Order Confirmed!</h1>
                <p className="text-muted-foreground">
                    Thank you for your purchase. Your order #{order.id} is now being processed.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Order Details</CardTitle>
                        <CardDescription>Placed on {format(order.date, 'PPP')}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleDownloadInvoice}>
                        <FileText className="mr-2 h-4 w-4" />
                        Download Invoice
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><Home className="h-5 w-5 text-muted-foreground" /> Shipping To</h4>
                            <div className="text-sm text-muted-foreground pl-7">
                                <p>{order.customerName}</p>
                                <p>{order.shippingAddress.line1}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5 text-muted-foreground" /> Payment Confirmation</h4>
                             <div className="text-sm text-muted-foreground pl-7">
                                <p>Status: <span className="font-medium text-green-600">Paid</span></p>
                                <p>Method: UPI / QR Code</p>
                                <p>Total: ₹{order.total.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                    <Separator />
                     <div className="text-sm space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" /> Order Summary</h4>
                        {order.items.map(item => (
                            <div key={item.productId} className="flex justify-between items-center pl-7">
                                <span>{item.name} x {item.quantity}</span>
                                <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                         <div className="flex justify-between items-center pl-7 font-bold pt-2">
                            <span>Total</span>
                            <span>₹{order.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg">
                    <Link href="/my-orders">
                        <Package className="mr-2 h-4 w-4" />
                        Track Your Order
                    </Link>
                </Button>
                 <Button asChild variant="outline" size="lg">
                    <Link href="/home#products">
                        Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}
