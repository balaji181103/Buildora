
'use client';

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
import { allOrders as customerOrders } from "@/lib/data"
import { ArrowRight, Package } from "lucide-react"

export default function MyOrdersPage() {
  // In a real application, you would fetch orders for the logged-in customer.
  // For now, we'll use the mock data.

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
                    {customerOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                You have no orders yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        customerOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>{order.date}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            order.status === "Delivered" ? "default" :
                                            order.status === "Processing" ? "secondary" : "destructive"
                                        }
                                        className={
                                            order.status === 'Delivered' ? 'bg-green-500/20 text-green-700' :
                                            order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700' :
                                            'bg-red-500/20 text-red-700'
                                        }
                                    >
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">₹{order.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">
                                        View Details <ArrowRight className="ml-2 h-4 w-4" />
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
