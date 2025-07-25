
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
import {
  Activity,
  IndianRupee,
  Users,
  Package,
  Wrench,
  AlertTriangle,
  Loader2,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OverviewChart } from "./overview-chart"
import { db } from "@/lib/firebase-client"
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore"
import type { Order, Product } from "@/lib/types"
import { ActionCard } from "@/components/ui/action-card"
import { format, subDays } from 'date-fns';

export default function DashboardPage() {
  const [lowStockProducts, setLowStockProducts] = React.useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [totalRevenue, setTotalRevenue] = React.useState<number | null>(null);
  const [todaysSales, setTodaysSales] = React.useState<number | null>(null);
  const [monthlySales, setMonthlySales] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Listener for low stock products
    const lowStockQuery = query(collection(db, "products"), where("stock", "<=", 3));
    const unsubscribeLowStock = onSnapshot(lowStockQuery, (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      setLowStockProducts(products);
    });

    // Listener for recent orders
    const recentOrdersQuery = query(collection(db, "orders"), orderBy("date", "desc"), limit(5));
    const unsubscribeRecentOrders = onSnapshot(recentOrdersQuery, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data,
          date: data.date.toDate()
        } as Order);
      });
      setRecentOrders(orders);
    });
    
    // Listener for total revenue
    const revenueQuery = query(collection(db, "orders"), where("status", "==", "Delivered"));
    const unsubscribeRevenue = onSnapshot(revenueQuery, (snapshot) => {
        let currentRevenue = 0;
        snapshot.forEach((doc) => {
            currentRevenue += doc.data().total;
        });
        setTotalRevenue(currentRevenue);
        setLoading(false);
    });

    // Listener for today's sales
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(startOfToday);

    const todaysSalesQuery = query(collection(db, "orders"), where("date", ">=", todayTimestamp));
    const unsubscribeTodaysSales = onSnapshot(todaysSalesQuery, (snapshot) => {
      let salesCount = 0;
      snapshot.forEach(() => {
        salesCount++;
      });
      setTodaysSales(salesCount);
    });
    
    // Listener for monthly sales
    const startOf30DaysAgo = subDays(new Date(), 30);
    const thirtyDaysAgoTimestamp = Timestamp.fromDate(startOf30DaysAgo);
    
    const monthlySalesQuery = query(collection(db, "orders"), where("date", ">=", thirtyDaysAgoTimestamp));
    const unsubscribeMonthlySales = onSnapshot(monthlySalesQuery, (snapshot) => {
      let salesCount = 0;
      snapshot.forEach(() => {
        salesCount++;
      });
      setMonthlySales(salesCount);
    });


    return () => {
      unsubscribeLowStock();
      unsubscribeRecentOrders();
      unsubscribeRevenue();
      unsubscribeTodaysSales();
      unsubscribeMonthlySales();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <>
                <div className="text-2xl font-bold">₹{totalRevenue?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                    From all delivered orders
                </p>
                </>
            )}
            </CardContent>
        </Card>
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Today's Sales
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                    <div className="text-2xl font-bold">+{todaysSales ?? 0}</div>
                    <p className="text-xs text-muted-foreground">
                        New orders placed today
                    </p>
                    </>
                )}
            </CardContent>
        </Card>
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                    <div className="text-2xl font-bold">+{monthlySales ?? 0}</div>
                    <p className="text-xs text-muted-foreground">
                        New orders in the last 30 days
                    </p>
                    </>
                )}
            </CardContent>
        </Card>
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
        <ActionCard href={{ pathname: '/products', query: { new: 'true' } }}>
          Add New Product
        </ActionCard>
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
              {recentOrders.length === 0 ? "You have no recent orders." : `You have ${recentOrders.length} recent orders.`}
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
                        <div className="font-medium">{order.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                            {format(order.date, 'PPP')}
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
                    <CardDescription>Critical alerts that require immediate attention.</CardDescription>
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
                            <TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link href="/products">Restock</Link></Button></TableCell>
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
