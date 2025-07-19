
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ListFilter,
  ShoppingCart,
  Calculator,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"

import { products } from "@/lib/data"
import { Product } from "@/lib/types"

function ProductCard({ product }: { product: Product }) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="p-0 relative">
            <Link href={`/products/${product.id}`}>
                <Image
                    alt={product.name}
                    className="aspect-square w-full rounded-t-lg object-cover"
                    height="250"
                    src={`https://placehold.co/250x250.png`}
                    width="250"
                    data-ai-hint="product image"
                />
            </Link>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">{product.category}</Badge>
            <CardTitle className="text-lg">
                <Link href={`/products/${product.id}`}>
                    {product.name}
                </Link>
            </CardTitle>
            <CardDescription className="text-sm">{product.supplier}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="font-semibold text-lg">₹{product.price.toFixed(2)}</div>
            <Button size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
            </Button>
        </CardFooter>
      </Card>
    );
}

function ProductCatalog() {
    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-center justify-end gap-2">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Filter
                    </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                    In Stock
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                    By Drone
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                    By Truck
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
                </DropdownMenu>
                <Select defaultValue="price_asc">
                    <SelectTrigger className="h-7 text-sm w-[140px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </section>
        </div>
    )
}

function MaterialEstimator() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-6 w-6"/>
                        AI Material Estimator
                    </CardTitle>
                    <CardDescription>
                        Fill in the details below to get an AI-powered material estimate for your project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <Label htmlFor="length">Length (m)</Label>
                            <Input id="length" type="number" placeholder="e.g., 5" />
                        </div>
                        <div>
                            <Label htmlFor="width">Width (m)</Label>
                            <Input id="width" type="number" placeholder="e.g., 4" />
                        </div>
                        <div>
                            <Label htmlFor="height">Height (m)</Label>
                            <Input id="height" type="number" placeholder="e.g., 2.4" />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="project-type">Project Type</Label>
                        <Select>
                            <SelectTrigger id="project-type">
                                <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="painting">Painting</SelectItem>
                                <SelectItem value="drywall">Drywall Installation</SelectItem>
                                <SelectItem value="flooring">Flooring</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full">Calculate Estimate</Button>
                </CardContent>
            </Card>

            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Estimated Materials</CardTitle>
                    <CardDescription>
                        Your calculated materials will appear here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-20">
                        Awaiting calculation...
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


export default function CustomerHomePage() {
  return (
    <div className="flex flex-col gap-4">
        <Breadcrumb>
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                <Link href="/home">Home</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>Store</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        
        <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">Product Catalog</TabsTrigger>
                <TabsTrigger value="estimator">Material Estimator</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-4">
                <ProductCatalog />
            </TabsContent>
            <TabsContent value="estimator" className="mt-4">
                <MaterialEstimator />
            </TabsContent>
        </Tabs>
    </div>
  )
}
