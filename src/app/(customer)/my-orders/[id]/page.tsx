
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter, useParams } from 'next/navigation';
import { OrderStatusTracker } from '@/components/ui/order-status-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, Loader2 } from 'lucide-react';
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

      <div className="grid grid-cols-1 gap-6 items-start">
         <Card className="max-w-sm mx-auto w-full">
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
  );
}
