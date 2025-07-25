
'use client';

import * as React from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Order } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Rocket, Truck, FileText, Edit, Package, Waypoints, Loader2 } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase-client";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            ordersData.push({ 
                id: doc.id,
                ...data,
                date: data.date.toDate() // Convert Firestore Timestamp to JS Date
            } as Order);
        });
        setOrders(ordersData);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    const orderRef = doc(db, "orders", orderId);
    try {
        await updateDoc(orderRef, { status });
        toast({
            title: "Status Updated",
            description: `Order ${orderId} has been updated to ${status}.`
        })
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? {...prev, status} : null);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update order status."
        })
    }
  }
  
  if (loading) {
    return (
        <div className="flex h-96 items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin" />
       </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                Manage and track all customer orders. Lightweight items are delivered by drone, heavy items by truck.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="gap-1">
              <Link href="#">
                <PlusCircle className="h-4 w-4" />
                New Order
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Delivery Info</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                          No orders found.
                      </TableCell>
                  </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        order.status === 'Delivered' ? 'default' :
                        order.status === 'Processing' ? 'secondary' : 'destructive'
                      }
                      className={
                        order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                        order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        order.status === 'Out for Delivery' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                        'bg-red-500/20 text-red-700 dark:text-red-300'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(order.date, 'PPP')}</TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2">
                          {order.deliveryMethod === 'Drone' ? <Rocket className="h-4 w-4 text-muted-foreground" /> : <Truck className="h-4 w-4 text-muted-foreground" />}
                          {order.deliveryVehicleId}
                      </div>
                  </TableCell>
                  <TableCell className="text-right">₹{order.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                         <DropdownMenuItem asChild>
                           <Link href={`/orders/${order.id}`}>
                              <Waypoints className="mr-2 h-4 w-4" />
                              Track Order
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleViewDetails(order)}>
                            <Package className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleUpdateStatus(order.id, 'Out for Delivery')} disabled={order.status === 'Out for Delivery' || order.status === 'Delivered'}>
                            <Edit className="mr-2 h-4 w-4" />
                            Set Out for Delivery
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-xl">
            {selectedOrder && (
                <>
                    <DialogHeader>
                        <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
                        <DialogDescription>
                            Full details for the order placed by {selectedOrder.customerName} on {format(selectedOrder.date, 'PPP')}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold">Items Ordered</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedOrder.items.map(item => (
                                        <TableRow key={item.productId}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-semibold">Order Status</h4>
                            <p className="text-sm text-muted-foreground">Current Status: {selectedOrder.status}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Processing')} disabled={selectedOrder.status === 'Processing'}>Set to Processing</Button>
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Out for Delivery')} disabled={selectedOrder.status === 'Out for Delivery'}>Set to Out for Delivery</Button>
                                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')} disabled={selectedOrder.status === 'Delivered'}>Set to Delivered</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')} disabled={selectedOrder.status === 'Cancelled'}>Cancel Order</Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-semibold">Delivery Information</h4>
                             <p className="text-sm text-muted-foreground">Method: {selectedOrder.deliveryMethod}</p>
                             <p className="text-sm text-muted-foreground">Vehicle ID: {selectedOrder.deliveryVehicleId}</p>
                             <p className="text-sm font-medium mt-2">Shipping Address:</p>
                             <p className="text-sm text-muted-foreground">
                                {selectedOrder.shippingAddress.line1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.pincode}
                             </p>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-semibold">Invoice</h4>
                            <Button variant="secondary" disabled>
                                <FileText className="mr-2 h-4 w-4" />
                                Generate PDF Invoice
                            </Button>
                            <p className="text-xs text-muted-foreground">PDF generation is coming soon.</p>
                        </div>
                    </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  )
}
