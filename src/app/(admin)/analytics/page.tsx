
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Package, Star, Download } from 'lucide-react';
import { OverviewChart } from '../dashboard/overview-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { products, customers } from '@/lib/data';

export default function AnalyticsPage() {
    const topProducts = [...products].sort((a,b) => b.stock - a.stock).slice(0, 5); // Mocking sales with stock
    const topCustomers = [...customers].sort((a,b) => b.orderCount - a.orderCount).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
            <p className="text-muted-foreground">
                Insights into your sales, products, and customer trends.
            </p>
            </div>
        </div>
         <div className="flex items-center gap-2">
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
            </Button>
            <Button variant="outline">
                 <Download className="mr-2 h-4 w-4" />
                Export Excel
            </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
            <TabsTrigger value="overview">Sales Overview</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
            <TabsTrigger value="customers">Customer Trends</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Sales Revenue</CardTitle>
                    <CardDescription>A chart displaying sales revenue over time. (Static data for now)</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <OverviewChart />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="products" className="mt-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Product Performance</CardTitle>
                    <CardDescription>Top-selling products based on units sold.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Units Sold (Mock)</TableHead>
                                <TableHead className="text-right">Revenue (Mock)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell className="text-right">{150 - product.stock}</TableCell>
                                    <TableCell className="text-right">₹{((150 - product.stock) * product.price).toLocaleString('en-IN')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Customer Trends</CardTitle>
                    <CardDescription>Top customers by order volume.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Total Orders</TableHead>
                                <TableHead className="text-right">Total Spent (Mock)</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {topCustomers.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell className="text-right">{customer.orderCount}</TableCell>
                                    <TableCell className="text-right">₹{(customer.orderCount * 1250).toLocaleString('en-IN')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="loyalty" className="mt-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Loyalty Program Statistics</CardTitle>
                    <CardDescription>Key metrics for the customer loyalty program.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Points Issued</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,250,000</div>
                            <p className="text-xs text-muted-foreground">Across all customers</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Points Redeemed</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">450,000</div>
                             <p className="text-xs text-muted-foreground">36% redemption rate</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Loyalty Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">1,234</div>
                            <p className="text-xs text-muted-foreground">82% of active customers</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
