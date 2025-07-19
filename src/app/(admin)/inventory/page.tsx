
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { products as initialProducts } from "@/lib/data"
import { ClipboardList, Search, AlertTriangle, History } from "lucide-react"
import type { Product } from "@/lib/types";
import { Input } from "@/components/ui/input";

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = React.useState("");

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: "Out of Stock", variant: "destructive" as const, icon: <AlertTriangle className="h-4 w-4 mr-2 text-destructive" /> };
    if (stock < 10) return { text: "Low Stock", variant: "secondary" as const, icon: <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" /> };
    return { text: "In Stock", variant: "default" as const };
  };

  const filteredProducts = React.useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Inventory Tracking
            </CardTitle>
            <CardDescription>Monitor stock levels and view product movement history.</CardDescription>
          </div>
          <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8 sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {filteredProducts.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No products found.
                    </TableCell>
                </TableRow>
             ) : filteredProducts.map((product) => {
                const status = getStockStatus(product.stock);
                return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="font-semibold">{product.stock}</TableCell>
                 <TableCell>
                  <Badge 
                    variant={status.variant} 
                    className={
                        status.variant === 'destructive' ? 'bg-red-500/10 text-red-600' :
                        status.variant === 'secondary' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-green-500/10 text-green-600'
                    }
                  >
                    <div className="flex items-center">
                        {status.icon}
                        {status.text}
                    </div>
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <History className="mr-2 h-4 w-4" />
                                View Logs
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Movement Logs for {product.name}</DialogTitle>
                                <DialogDescription>
                                    This feature is coming soon. Here you will see a detailed history of stock movements, including inbound shipments, outbound orders, and adjustments.
                                </DialogDescription>
                            </DialogHeader>
                             <div className="text-center text-muted-foreground py-10">
                                No movement logs available yet.
                            </div>
                        </DialogContent>
                    </Dialog>
                </TableCell>
              </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
