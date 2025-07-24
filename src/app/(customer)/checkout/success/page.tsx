
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { allOrders } from '@/lib/data';
import { CheckCircle2, FileText, ShoppingBag, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { toast } = useToast();

    const order = React.useMemo(() => {
        return allOrders.find(o => o.id === orderId);
    }, [orderId]);

    const handleDownloadInvoice = () => {
        toast({
            title: "Coming Soon!",
            description: "PDF invoice generation is not yet implemented.",
        });
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p className="text-muted-foreground">We couldn't find the details for this order.</p>
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
                <h1 className="text-3xl font-bold tracking-tight">Order Placed Successfully!</h1>
                <p className="text-muted-foreground">
                    Thank you for your purchase. Your order is now being processed.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Order Summary</CardTitle>
                        <CardDescription>Order ID: {order.id}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleDownloadInvoice}>
                        <FileText className="mr-2 h-4 w-4" />
                        Download Invoice
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-4">
                     <div className="text-sm">
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                                <p className="font-semibold">Order Date:</p>
                                <p className="text-muted-foreground">{order.date}</p>
                           </div>
                           <div>
                                <p className="font-semibold">Order Total:</p>
                                <p className="text-muted-foreground">₹{order.total.toLocaleString('en-IN')}</p>
                           </div>
                           <div>
                                <p className="font-semibold">Delivery Method:</p>
                                <p className="text-muted-foreground">{order.deliveryMethod}</p>
                           </div>
                            <div>
                                <p className="font-semibold">Status:</p>
                                <p className="text-muted-foreground">{order.status}</p>
                            </div>
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
