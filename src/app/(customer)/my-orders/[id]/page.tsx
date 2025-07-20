
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { allOrders, products as allProducts } from '@/lib/data';
import { OrderStatusTracker } from '@/components/ui/order-status-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, HelpCircle, Package, Receipt, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const order = allOrders.find(o => o.id === params.id);

  if (!order) {
    notFound();
  }
  
  // Mocking product details for the order summary
  const orderItems = [
      { product: allProducts[0], quantity: 2 },
      { product: allProducts[2], quantity: 1 }
  ];

  const subtotal = orderItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = order.total - subtotal;


  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Orders</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">Order ID: {order.id}</p>
        </div>
      </div>

      <OrderStatusTracker currentStatus={order.status} deliveryMethod={order.deliveryMethod} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 items-start">
        <div className="lg:col-span-3 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {orderItems.map(item => (
                            <div key={item.product.id} className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Image 
                                        src="https://placehold.co/64x64.png" 
                                        alt={item.product.name}
                                        width={64}
                                        height={64}
                                        className="rounded-md object-cover"
                                        data-ai-hint="product image"
                                    />
                                    <div>
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="font-medium text-right">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>₹{shipping.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxes</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-bold text-base">
                            <span>Total</span>
                            <span>₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="font-medium">Shipping Address</p>
                        <p className="text-sm text-muted-foreground">Priya Sharma</p>
                        <p className="text-sm text-muted-foreground">123, Blossom Heights, Hiranandani Gardens, Powai, Mumbai - 400076</p>
                    </div>
                     <div>
                        <p className="font-medium">Delivery Method</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                           {order.deliveryMethod === 'Drone' ? <Rocket className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                            <span>{order.deliveryMethod} ({order.deliveryVehicleId})</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <Button variant="outline" className="w-full justify-start gap-2">
                        <FileText className="h-4 w-4" /> View Invoice
                    </Button>
                     <Button variant="outline" className="w-full justify-start gap-2">
                        <HelpCircle className="h-4 w-4" /> Contact Support
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
