
'use client';

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ListFilter,
  ShoppingCart,
  Calculator,
  Loader2,
  AlertTriangle,
  Plus,
} from "lucide-react"
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getMaterialEstimate } from "@/app/actions/material-estimator";
import type { MaterialEstimatorOutput } from "@/ai/flows/material-estimator-flow";

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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { products } from "@/lib/data"
import { Product } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast";

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
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
                    <p className="text-muted-foreground">Browse our available products.</p>
                </div>
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
            </div>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </section>
        </div>
    )
}

const materialEstimatorSchema = z.object({
    length: z.coerce.number().min(0.1, 'Length must be positive.'),
    width: z.coerce.number().min(0.1, 'Width must be positive.'),
    height: z.coerce.number().min(0.1, 'Height must be positive.'),
    projectType: z.enum(['brickwork', 'concreting'], {
      required_error: "You need to select a project type.",
    }),
});

type MaterialEstimatorFormValues = z.infer<typeof materialEstimatorSchema>;

function MaterialEstimator() {
    const [isPending, startTransition] = React.useTransition();
    const [estimate, setEstimate] = React.useState<MaterialEstimatorOutput | null>(null);
    const { toast } = useToast();

    const form = useForm<MaterialEstimatorFormValues>({
        resolver: zodResolver(materialEstimatorSchema),
        defaultValues: {
            length: 10,
            width: 0.23,
            height: 3,
        }
    });

    const onSubmit = (values: MaterialEstimatorFormValues) => {
        setEstimate(null);
        startTransition(async () => {
            const result = await getMaterialEstimate(values);
            if(result.success) {
                setEstimate(result.estimate);
                toast({
                    title: "Estimate Generated",
                    description: "Your material estimate has been calculated successfully.",
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error,
                });
            }
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">AI Material Estimator</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-3">
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Calculator className="h-5 w-5"/>
                                Project Details
                            </CardTitle>
                            <CardDescription>
                                For brickwork or concreting projects. Fill in dimensions to get an AI-powered estimate.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="length">Length (m)</Label>
                                    <Input id="length" type="number" placeholder="e.g., 5" {...form.register('length')} />
                                    {form.formState.errors.length && <p className="text-destructive text-xs mt-1">{form.formState.errors.length.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="width">Width (m)</Label>
                                    <Input id="width" type="number" placeholder="e.g., 0.23" {...form.register('width')} />
                                    {form.formState.errors.width && <p className="text-destructive text-xs mt-1">{form.formState.errors.width.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="height">Height (m)</Label>
                                    <Input id="height" type="number" placeholder="e.g., 3" {...form.register('height')} />
                                    {form.formState.errors.height && <p className="text-destructive text-xs mt-1">{form.formState.errors.height.message}</p>}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="project-type">Project Type</Label>
                                <Controller
                                    control={form.control}
                                    name="projectType"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger id="project-type">
                                                <SelectValue placeholder="Select project type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="brickwork">Brickwork</SelectItem>
                                                <SelectItem value="concreting">Concreting</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {form.formState.errors.projectType && <p className="text-destructive text-xs mt-1">{form.formState.errors.projectType.message}</p>}
                            </div>
                        </CardContent>
                        <CardFooter>
                             <Button className="w-full" type="submit" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating...</> : 'Calculate Estimate'}
                             </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-xl">Estimated Materials</CardTitle>
                        <CardDescription>
                            Your calculated materials for bricks and cement will appear here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isPending && (
                             <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                             </div>
                        )}
                        {!isPending && !estimate && (
                            <div className="text-center text-muted-foreground py-20">
                                Awaiting calculation...
                            </div>
                        )}
                        {estimate && (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Material</TableHead>
                                            <TableHead className="text-right">Estimated Quantity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {estimate.materials.map((material, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{material.name}</TableCell>
                                                <TableCell className="text-right">{material.quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Notes & Assumptions</AlertTitle>
                                    <AlertDescription>
                                        {estimate.notes}
                                    </AlertDescription>
                                </Alert>
                                 <div className="flex gap-4">
                                    <Button className="w-full">
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Add to Cart
                                    </Button>
                                    <Button variant="outline" className="w-full">Download PDF</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default function CustomerHomePage() {
  return (
    <div className="flex flex-col gap-6">
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

        <MaterialEstimator />

        <Separator className="my-6" />
        
        <ProductCatalog />

    </div>
  )
}
