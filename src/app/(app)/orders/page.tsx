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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { allOrders } from "@/lib/data"
import { MoreHorizontal, PlusCircle, Rocket, Truck } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  return (
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
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Update Status</DropdownMenuItem>
                      <DropdownMenuItem>Generate Invoice</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
