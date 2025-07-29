
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter, useParams } from 'next/navigation';
import { OrderStatusTracker } from '@/components/ui/order-status-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map, AlertTriangle, Package, HelpCircle, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Order } from '@/lib/types';


export default function CustomerOrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setOrder(orderData);
        setLoading(false);
      } else {
        notFound();
      }
    });

    return () => unsubscribe();
  }, [id]);

  if (loading || !order) {
    return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Orders</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Track Order</h1>
          <p className="text-muted-foreground">Order ID: #{order.id}</p>
        </div>
      </div>
      
      <OrderStatusTracker currentStatus={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5"/> Delivery Map</CardTitle>
                    <CardDescription>Real-time location of your delivery.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
                         <Image src="https://placehold.co/800x450.png" alt="Map view of delivery route" layout="fill" objectFit="cover" data-ai-hint="map delivery" />
                         <div className="absolute top-1/4 left-1/4">
                            <Package className="h-8 w-8 text-primary drop-shadow-lg animate-pulse" />
                         </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                     <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                        <div>
                            <p className="font-semibold text-yellow-700">Potential Delay</p>
                            <p className="text-sm text-yellow-600">High traffic reported in the delivery area. Arrival may be slightly delayed.</p>
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
                        <HelpCircle className="h-4 w-4" /> Contact Support
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
