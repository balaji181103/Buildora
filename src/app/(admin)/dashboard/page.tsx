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
import {
  Activity,
  IndianRupee,
  Users,
  Package,
  Wrench,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OverviewChart } from "./overview-chart"
import { recentOrders, products } from "@/lib/data"

export default function DashboardPage() {
  const lowStockProducts = products.filter(p => p.stock < 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/orders">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹0.00</div>
              <p className="text-xs text-muted-foreground">
                No data available yet
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/orders">
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Active Deliveries
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                No active delivery routes
                </p>
            </CardContent>
            </Card>
        </Link>
        <Link href="/orders">
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                No sales this month
                </p>
            </CardContent>
            </Card>
        </Link>
        <Link href="/drones">
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                System Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                <span className="text-green-500">●</span> All Systems Go
                </div>
                <p className="text-xs text-muted-foreground">
                As of the last check
                </p>
            </CardContent>
            </Card>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              There are no recent orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {recentOrders.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">No recent orders to display.</div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell>
                        <div className="font-medium">{order.customer}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                            {order.id}
                        </div>
                        </TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            order.status === "Delivered" ? "default" : 
                            order.status === "Processing" ? "secondary" : "destructive"
                            }
                            className={
                            order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                            order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' : 
                            'bg-red-500/20 text-red-700 border-red-500/30'
                            }
                        >
                            {order.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">₹{order.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle>Inventory & Maintenance Alerts</CardTitle>
                    <CardDescription>Critical alerts that require immediate attention. For lightweight products, drones will be used for delivery. For heavy products, trucks will be used.</CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/products">
                    View All
                  </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {lowStockProducts.length === 0 ? (
                 <div className="text-center text-muted-foreground py-10">No alerts to display.</div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Details</TableHead>
                             <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow className="bg-amber-500/10">
                            <TableCell><div className="font-medium flex items-center gap-2"><Wrench className="h-4 w-4"/> Drone SB-004</div></TableCell>
                            <TableCell><Badge variant="outline" className="text-amber-600 border-amber-500/50">Maintenance Due</Badge></TableCell>
                            <TableCell>Flight hours limit reached (350h)</TableCell>
                             <TableCell className="text-right"><Button variant="outline" size="sm">Log Maintenance</Button></TableCell>
                        </TableRow>
                        {lowStockProducts.map(product => (
                        <TableRow key={product.id} className="bg-red-500/10">
                            <TableCell><div className="font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {product.name}</div></TableCell>
                            <TableCell><Badge variant="destructive">Low Stock</Badge></TableCell>
                            <TableCell>{product.stock} units remaining</TableCell>
                            <TableCell className="text-right"><Button variant="outline" size="sm">Restock</Button></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
       </div>
    </div>
  )
}
