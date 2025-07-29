
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Loader2 } from "lucide-react"
import Link from "next/link";
import { db } from '@/lib/firebase-client';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Order } from '@/lib/types';
import { format } from 'date-fns';

export default function MyOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const customerId = localStorage.getItem('loggedInCustomerId');
    if (!customerId) {
        setLoading(false);
        // In a real app with proper auth, you might redirect to login.
        // For now, we'll just show an empty state.
        return;
    }

    const q = query(
        collection(db, "orders"), 
        where("customerId", "==", customerId)
        // Note: Ordering by date was removed to prevent a missing-index error.
        // We will sort the data on the client side instead.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const customerOrders: Order[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            customerOrders.push({
                id: doc.id,
                ...data,
                date: data.date.toDate() // Convert Firestore Timestamp to JS Date
            } as Order);
        });
        // Sort the orders by date client-side
        customerOrders.sort((a, b) => b.date.getTime() - a.date.getTime());
        setOrders(customerOrders);
        setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
                <p className="text-muted-foreground">Review your order history and track current deliveries.</p>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                Here is a list of all your past and current orders with Buildora.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                         <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                You have no orders yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>{format(order.date, 'PPP')}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            order.status === "Delivered" ? "default" :
                                            order.status === "Processing" ? "secondary" : 
                                            order.status === "Out for Delivery" ? "secondary" : "destructive"
                                        }
                                        className={
                                            order.status === 'Delivered' ? 'bg-green-500/20 text-green-700' :
                                            order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700' :
                                            order.status === 'Out for Delivery' ? 'bg-yellow-500/20 text-yellow-700' :
                                            'bg-red-500/20 text-red-700'
                                        }
                                    >
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">₹{order.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/my-orders/${order.id}`}>
                                            Track Order <ArrowRight className="ml-2 h-4 w-4" />
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
    </div>
  )
}
