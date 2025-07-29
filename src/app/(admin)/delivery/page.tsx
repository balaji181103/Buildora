
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Waypoints, Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { db } from '@/lib/firebase-client';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';

export default function DeliveryPage() {
  const [deliveringOrders, setDeliveringOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'Out for Delivery')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data,
          date: data.date.toDate(),
        } as Order);
      });
      // Sort by date on the client-side
      ordersData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setDeliveringOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-6 w-6" />
          Delivery Management
        </CardTitle>
        <CardDescription>
          Monitor all orders currently out for delivery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Delivery Address</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </TableCell>
              </TableRow>
            ) : deliveringOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <p className="text-muted-foreground">
                    No orders are currently out for delivery.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              deliveringOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    {order.shippingAddress.line1}, {order.shippingAddress.city}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹
                    {order.total.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Waypoints className="mr-2 h-4 w-4" />
                        Track
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
