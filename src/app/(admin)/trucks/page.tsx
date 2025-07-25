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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Truck } from "@/lib/types";


export default function TrucksPage() {
    const [trucks, setTrucks] = React.useState<Truck[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const q = query(collection(db, "trucks"), orderBy("id"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const trucksData: Truck[] = [];
            snapshot.forEach(doc => {
                trucksData.push({ ...doc.data() } as Truck);
            });
            setTrucks(trucksData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trucks</CardTitle>
            <CardDescription>Manage your fleet of delivery trucks for heavy products.</CardDescription>
          </div>
          <Button asChild size="sm" className="gap-1">
            <Link href="#">
              <PlusCircle className="h-4 w-4" />
              Add Truck
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Truck ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mileage (km)</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : trucks.map((truck) => (
              <TableRow key={truck.id}>
                <TableCell className="font-medium">{truck.id}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      truck.status === 'Idle' ? 'secondary' :
                      truck.status === 'Maintenance' ? 'destructive' : 'default'
                    }
                    className={
                      truck.status === 'Idle' ? 'bg-gray-500/20 text-gray-700 dark:text-gray-300' :
                      truck.status === 'Maintenance' ? 'bg-red-500/20 text-red-700' :
                      truck.status === 'Delivering' ? 'bg-blue-500/20 text-blue-700' :
                      'bg-yellow-500/20 text-yellow-700'
                    }
                  >
                    {truck.status}
                  </Badge>
                </TableCell>
                <TableCell>{truck.mileage.toLocaleString('en-IN')}</TableCell>
                <TableCell>{truck.location}</TableCell>
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
                      <DropdownMenuItem>Assign Delivery</DropdownMenuItem>
                      <DropdownMenuItem>Schedule Maintenance</DropdownMenuItem>
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
