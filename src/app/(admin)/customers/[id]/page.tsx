
'use client';

import { notFound, useRouter } from 'next/navigation';
import { customers, allOrders } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Home, Star, Package, Rocket } from 'lucide-react';

export default function CustomerProfilePage({ params: { id } }: { params: { id: string } }) {
  const router = useRouter();
  const customer = customers.find((c) => c.id === id);
  
  if (!customer) {
    notFound();
  }

  const customerOrders = allOrders.filter(order => order.customer === customer.name);
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0][0] || '';
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Profile</h1>
          <p className="text-muted-foreground">Detailed view of {customer.name}.</p>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Profile and Addresses */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={`https://placehold.co/100x100.png`} alt={customer.name} data-ai-hint="profile picture" />
                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                </Avatar>
                <CardTitle>{customer.name}</CardTitle>
                 <Badge 
                    variant={customer.status === 'Active' ? 'secondary' : 'destructive'}
                    className={`mt-2 ${
                      customer.status === 'Active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
                    }`}
                  >
                    {customer.status}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+91 98765 43210</span>
                </div>
                 <div className="flex items-center gap-3 text-sm">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.loyaltyPoints} Loyalty Points</span>
                </div>
                 <div className="flex items-center gap-3 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.orderCount} Total Orders</span>
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle>Addresses</CardTitle>
                <CardDescription>Customer's saved delivery addresses.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No addresses found.</p>
              ) : (
                customer.addresses.map((address) => (
                    <div key={address.id} className="text-sm">
                       <p className="font-semibold flex items-center gap-2"><Home className="h-4 w-4" /> {address.label}</p>
                       <p className="text-muted-foreground pl-6">{address.line1}</p>
                       {address.line2 && <p className="text-muted-foreground pl-6">{address.line2}</p>}
                       <p className="text-muted-foreground pl-6">{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Order History */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>A list of all orders placed by {customer.name}.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {customerOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No orders found for this customer.
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
                                                order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                                                order.status === 'Processing' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' : 
                                                'bg-red-500/20 text-red-700 border-red-500/30'
                                                }
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">₹{order.total.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
