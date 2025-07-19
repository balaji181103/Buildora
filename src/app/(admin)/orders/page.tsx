
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
import { allOrders, customers, products as allProducts } from "@/lib/data"
import type { Order } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Rocket, Truck, FileText, Edit, Package } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

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
              {allOrders.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                          No orders found.
                      </TableCell>
                  </TableRow>
              ) : allOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        order.status === 'Delivered' ? 'default' :
                        order.status === 'Processing' ? 'secondary' : 'destructive'
                      }
                      className={
                        order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                        order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        'bg-red-500/20 text-red-700 dark:text-red-300'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
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
                        <DropdownMenuItem onSelect={() => handleViewDetails(order)}>
                            <Package className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleViewDetails(order)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleViewDetails(order)}>
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
                            Full details for the order placed by {selectedOrder.customer} on {selectedOrder.date}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold">Customer Information</h4>
                            <p className="text-sm text-muted-foreground">{selectedOrder.customer}</p>
                            <p className="text-sm text-muted-foreground">{customers.find(c => c.name === selectedOrder.customer)?.email}</p>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-semibold">Order Status</h4>
                            <p className="text-sm text-muted-foreground">Current Status: {selectedOrder.status}</p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled>Set to Processing</Button>
                                <Button variant="outline" size="sm" disabled>Set to Delivered</Button>
                                <Button variant="destructive" size="sm" disabled>Cancel Order</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Status update functionality is coming soon.</p>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-semibold">Delivery Information</h4>
                             <p className="text-sm text-muted-foreground">Method: {selectedOrder.deliveryMethod}</p>
                             <p className="text-sm text-muted-foreground">Vehicle ID: {selectedOrder.deliveryVehicleId}</p>
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
