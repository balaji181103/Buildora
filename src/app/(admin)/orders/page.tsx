
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
import type { Order, Product } from "@/lib/types";
import { MoreHorizontal, PlusCircle, FileText, Package, Loader2, Clock, CheckCircle, Truck, Send, View, Warehouse, ThumbsUp, PackageCheck } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase-client";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type OrderItemWithProduct = {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    product?: Product;
};

type OrderWithProductDetails = Order & {
    items: OrderItemWithProduct[];
}

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = React.useState<OrderWithProductDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  const [newOrders, setNewOrders] = React.useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = React.useState<Order[]>([]);
  const [hubOrders, setHubOrders] = React.useState<Order[]>([]);
  const [outForDeliveryOrders, setOutForDeliveryOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    // Listener for all orders
    const allOrdersQuery = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubAll = onSnapshot(allOrdersQuery, (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            ordersData.push({ 
                id: doc.id,
                ...data,
                date: data.date.toDate()
            } as Order);
        });
        setAllOrders(ordersData);
        setLoading(false);
    });

    // New Orders ('Pending')
    const newOrdersQuery = query(collection(db, "orders"), where("status", "==", "Pending"));
    const unsubNew = onSnapshot(newOrdersQuery, (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach(doc => { const data = doc.data(); ordersData.push({ id: doc.id, ...data, date: data.date.toDate() } as Order); });
        ordersData.sort((a, b) => a.date.getTime() - b.date.getTime());
        setNewOrders(ordersData);
    });

    // Pending Orders ('Processing')
    const pendingOrdersQuery = query(collection(db, "orders"), where("status", "==", "Processing"));
    const unsubPending = onSnapshot(pendingOrdersQuery, (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach(doc => { const data = doc.data(); ordersData.push({ id: doc.id, ...data, date: data.date.toDate() } as Order); });
        ordersData.sort((a, b) => a.date.getTime() - b.date.getTime());
        setPendingOrders(ordersData);
    });

    // Hub Orders ('At Hub')
    const hubOrdersQuery = query(collection(db, "orders"), where("status", "==", "At Hub"));
    const unsubHub = onSnapshot(hubOrdersQuery, (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach(doc => { const data = doc.data(); ordersData.push({ id: doc.id, ...data, date: data.date.toDate() } as Order); });
        ordersData.sort((a, b) => a.date.getTime() - b.date.getTime());
        setHubOrders(ordersData);
    });

    // Out for Delivery Orders
    const outForDeliveryQuery = query(collection(db, "orders"), where("status", "==", "Out for Delivery"));
    const unsubOutForDelivery = onSnapshot(outForDeliveryQuery, (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach(doc => { const data = doc.data(); ordersData.push({ id: doc.id, ...data, date: data.date.toDate() } as Order); });
        ordersData.sort((a, b) => a.date.getTime() - b.date.getTime());
        setOutForDeliveryOrders(ordersData);
    });


    return () => {
        unsubAll();
        unsubNew();
        unsubPending();
        unsubHub();
        unsubOutForDelivery();
    };
  }, []);

  const handleViewDetails = async (order: Order) => {
    const itemsWithProductDetails = await Promise.all(
        order.items.map(async (item) => {
            const productRef = doc(db, "products", item.productId);
            const productSnap = await getDoc(productRef);
            return {
                ...item,
                product: productSnap.exists() ? productSnap.data() as Product : undefined
            }
        })
    );
    setSelectedOrder({ ...order, items: itemsWithProductDetails });
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    const orderRef = doc(db, "orders", orderId);
    try {
        await updateDoc(orderRef, { status });
        toast({
            title: "Status Updated",
            description: `Order #${orderId.substring(0,6)}... has been updated to ${status}.`
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

  const renderOrderRow = (order: Order) => (
     <TableRow key={order.id}>
        <TableCell className="font-medium">#{order.id}</TableCell>
        <TableCell>{order.customerName}</TableCell>
        <TableCell>
            <Badge 
                variant={
                    order.status === 'Delivered' ? 'default' :
                    order.status === 'Processing' ? 'secondary' : 
                    order.status === 'Pending' ? 'secondary' : 'destructive'
                }
                className={
                    order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                    order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                    order.status === 'Out for Delivery' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                    order.status === 'Pending' ? 'bg-gray-500/20 text-gray-700 dark:text-gray-300' :
                    order.status === 'At Hub' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' :
                    'bg-red-500/20 text-red-700 dark:text-red-300'
                }
            >
                {order.status}
            </Badge>
        </TableCell>
        <TableCell className="text-right">₹{order.total.toLocaleString('en-IN')}</TableCell>
        <TableCell className="text-right">
             <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>View</Button>
            </div>
        </TableCell>
    </TableRow>
  );

  return (
    <>
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5"/> New Orders</CardTitle>
                <CardDescription>Approve these new orders to begin processing.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {newOrders.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">No new orders.</TableCell></TableRow>
                        ) : (
                            newOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'Processing')}>
                                            <ThumbsUp className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/> Pending Orders</CardTitle>
                <CardDescription>These orders are approved and ready for shipping to the distribution hub.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                           <TableHead>ID</TableHead>
                           <TableHead>Customer</TableHead>
                           <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingOrders.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">No pending orders.</TableCell></TableRow>
                        ) : (
                            pendingOrders.map(order => (
                                 <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'At Hub')}>
                                            <Package className="mr-2 h-4 w-4" /> Ship Item
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5"/> At Hub</CardTitle>
                <CardDescription>Orders that have arrived at the hub and are awaiting dispatch.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>ID</TableHead>
                           <TableHead>Customer</TableHead>
                           <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hubOrders.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">No orders at the hub.</TableCell></TableRow>
                        ) : (
                            hubOrders.map(order => (
                                 <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}>
                                            <Truck className="mr-2 h-4 w-4" /> Out for Delivery
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5"/> Out for Delivery</CardTitle>
                <CardDescription>Orders currently on their way to the customer.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>ID</TableHead>
                           <TableHead>Customer</TableHead>
                           <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {outForDeliveryOrders.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">No orders are out for delivery.</TableCell></TableRow>
                        ) : (
                            outForDeliveryOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                                            <PackageCheck className="mr-2 h-4 w-4" /> Delivered
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                Manage and track all customer orders.
              </CardDescription>
            </div>
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
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allOrders.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          No orders found.
                      </TableCell>
                  </TableRow>
              ) : allOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <Badge 
                        variant={
                            order.status === 'Delivered' ? 'default' :
                            order.status === 'Processing' ? 'secondary' : 
                            order.status === 'Pending' ? 'secondary' : 'destructive'
                        }
                        className={
                            order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                            order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                            order.status === 'Out for Delivery' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                            order.status === 'Pending' ? 'bg-gray-500/20 text-gray-700 dark:text-gray-300' :
                            order.status === 'At Hub' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' :
                            'bg-red-500/20 text-red-700 dark:text-red-300'
                        }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(order.date, 'PPP')}</TableCell>
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
                        <DropdownMenuItem onSelect={() => handleViewDetails(order)}>
                            <View className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
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
        <DialogContent className="sm:max-w-3xl">
            {selectedOrder && (
                <>
                    <DialogHeader>
                        <DialogTitle>Order Details: #{selectedOrder.id}</DialogTitle>
                        <DialogDescription>
                            Full details for the order placed by {selectedOrder.customerName} on {format(selectedOrder.date, 'PPP')}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Customer Details</h4>
                                <div className="text-sm text-muted-foreground">
                                    <p>{selectedOrder.customerName}</p>
                                    <p>{selectedOrder.shippingAddress.line1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.pincode}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold">Items Ordered</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[64px]">Image</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items.map(item => (
                                            <TableRow key={item.productId}>
                                                <TableCell>
                                                    <Image 
                                                        src={item.product?.imageUrl || 'https://placehold.co/64x64.png'} 
                                                        alt={item.name} 
                                                        width={48} 
                                                        height={48} 
                                                        className="rounded-md object-cover"
                                                        data-ai-hint="product image"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.product?.category} | {item.product?.supplier}</div>
                                                </TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                         <div className="space-y-2">
                            <h4 className="font-semibold">Order Status</h4>
                            <p className="text-sm text-muted-foreground">Current Status: {selectedOrder.status}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedOrder.status === 'Pending' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Processing')}>Approve Order</Button>}
                                {selectedOrder.status === 'Processing' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'At Hub')}>Ship to Hub</Button>}
                                {selectedOrder.status === 'At Hub' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Out for Delivery')}>Dispatch for Delivery</Button>}
                                {selectedOrder.status === 'Out for Delivery' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}>Mark as Delivered</Button>}
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')} disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered'}>Cancel Order</Button>
                            </div>
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
    </div>
    </>
  )
}
