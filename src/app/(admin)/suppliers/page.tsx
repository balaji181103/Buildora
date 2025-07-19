
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
import { suppliers as initialSuppliers, products } from "@/lib/data"
import { MoreHorizontal, PlusCircle, Building2 } from "lucide-react"
import type { Supplier } from "@/lib/types";
import { AddSupplierForm } from "./add-supplier-form";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>(initialSuppliers);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleSupplierAdded = (newSupplier: Supplier) => {
    setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier]);
    setIsDialogOpen(false);
  };
  
  const getSupplierProductCategories = (supplierName: string) => {
      const supplierProducts = products.filter(p => p.supplier === supplierName);
      const categories = new Set(supplierProducts.map(p => p.category));
      return Array.from(categories);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Suppliers
            </CardTitle>
            <CardDescription>
              Manage your product suppliers and their contact information.
            </CardDescription>
          </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new supplier below.
                  </DialogDescription>
                </DialogHeader>
                <AddSupplierForm onSupplierAdded={handleSupplierAdded} />
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Product Categories</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">
                  {supplier.name}
                </TableCell>
                <TableCell>
                    <div>{supplier.contactPerson}</div>
                    <div className="text-sm text-muted-foreground">{supplier.email}</div>
                    <div className="text-sm text-muted-foreground">{supplier.phone}</div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {getSupplierProductCategories(supplier.name).map(category => (
                            <Badge key={category} variant="secondary">{category}</Badge>
                        ))}
                    </div>
                </TableCell>
                <TableCell className="text-right">{supplier.productCount}</TableCell>
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
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View Products</DropdownMenuItem>
                      <DropdownMenuItem disabled>View Purchase History</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
