
'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Waypoints, User, MessageSquare, Loader2, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { db } from '@/lib/firebase-client';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Order, Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { OrderStatusTracker } from '@/components/ui/order-status-tracker';


export default function AdminOrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [order, setOrder] = React.useState<Order | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!id) return;
    const unsubscribeOrder = onSnapshot(doc(db, "orders", id), async (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data(), date: docSnap.data().date.toDate() } as Order;
        setOrder(orderData);
        
        // Fetch customer details
        if (orderData.customerId) {
            const unsubCustomer = onSnapshot(doc(db, "customers", orderData.customerId), (custSnap) => {
                 if (custSnap.exists()) {
                     setCustomer({ id: custSnap.id, ...custSnap.data() } as Customer);
                 }
                 setLoading(false);
            });
            
            return () => {
                unsubCustomer();
            };
        } else {
            setLoading(false);
        }

      } else {
        notFound();
      }
    });

    return () => unsubscribeOrder();
  }, [id]);


  if (loading || !order) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Waypoints className="h-6 w-6" /> Live Order Tracking</h1>
            <p className="text-muted-foreground">Monitoring Order ID: #{order.id}</p>
            </div>
        </div>
        <Badge variant="secondary" className="text-base py-1 px-3">{order.status}</Badge>
      </div>
      
      <OrderStatusTracker currentStatus={order.status} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="font-semibold">{customer?.name}</p>
                <p className="text-sm text-muted-foreground">{customer?.email}</p>
                {customer && <Link href={`/customers/${customer?.id}`} className="text-sm text-primary hover:underline mt-2 inline-block">View Full Profile</Link>}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> Message Customer
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
