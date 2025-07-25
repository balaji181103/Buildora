
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { MoreHorizontal, PlusCircle, Star, Package, Loader2 } from "lucide-react"
import type { Customer } from "@/lib/types";
import { db } from "@/lib/firebase-client";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach(doc => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeactivate = async (customerId: string) => {
    const customerRef = doc(db, "customers", customerId);
    try {
      await updateDoc(customerRef, { status: "Inactive" });
      toast({
        title: "Customer Deactivated",
        description: "The customer account has been marked as inactive.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not deactivate the customer account.",
      });
    }
  };
  
   if (loading) {
        return (
             <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>
              Manage your customers and view their order history.
            </CardDescription>
          </div>
          <Button asChild size="sm" className="gap-1">
            <Link href="#">
              <PlusCircle className="h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Loyalty Points</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <div>{customer.name}</div>
                  <div className="text-sm text-muted-foreground">{customer.email}</div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={customer.status === 'Active' ? 'secondary' : 'destructive'}
                    className={
                      customer.status === 'Active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
                    }
                  >
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    {customer.loyaltyPoints}
                  </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {customer.orderCount}
                    </div>
                </TableCell>
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
                        <Link href={`/customers/${customer.id}`}>View Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => handleDeactivate(customer.id)}
                        disabled={customer.status === 'Inactive'}
                      >
                        Deactivate Account
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
  )
}
