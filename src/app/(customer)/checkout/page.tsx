
'use client';

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { PlusCircle, Loader2, Package, Truck, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { nanoid } from 'nanoid'
import { db } from "@/lib/firebase-client";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import type { Customer, Address } from "@/lib/types";
import Image from "next/image"

const deliveryOptions = {
    standard: { name: 'Standard Delivery', cost: 0, description: '3-5 Business Days', icon: Package },
    faster: { name: 'Faster Delivery', cost: 100, description: '1-2 Business Days', icon: Truck },
};

export default function CheckoutPage() {
    const { cart } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedAddressId, setSelectedAddressId] = React.useState<string | undefined>(undefined);
    const [showNewAddressForm, setShowNewAddressForm] = React.useState(false);
    
    // New Address Form State
    const [newAddressLabel, setNewAddressLabel] = React.useState('');
    const [newAddressLine1, setNewAddressLine1] = React.useState('');
    const [newAddressCity, setNewAddressCity] = React.useState('');
    const [newAddressState, setNewAddressState] = React.useState('');
    const [newAddressPincode, setNewAddressPincode] = React.useState('');

    const [isProcessing, setIsProcessing] = React.useState(false);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isSavingAddress, setIsSavingAddress] = React.useState(false);
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = React.useState('standard');

    React.useEffect(() => {
        const customerId = localStorage.getItem('loggedInCustomerId');
        if (!customerId) {
            setLoading(false);
            // Optionally redirect to login
            return;
        }

        const unsubscribe = onSnapshot(doc(db, "customers", customerId), (docSnap) => {
            if (docSnap.exists()) {
                const customerData = { id: docSnap.id, ...docSnap.data() } as Customer;
                setCustomer(customerData);
                 if (customerData.addresses && customerData.addresses.length > 0) {
                    if (!selectedAddressId) {
                        setSelectedAddressId(customerData.addresses[0].id);
                    }
                } else {
                    setShowNewAddressForm(true);
                }
            } else {
                setShowNewAddressForm(true);
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [selectedAddressId]);

     
    const subtotal = React.useMemo(() => {
        return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    }, [cart]);

    const shippingCost = deliveryOptions[selectedDeliveryMethod as keyof typeof deliveryOptions]?.cost || 0;
    const taxes = subtotal * 0.18; // Mock 18% tax
    const pointsEarned = Math.floor(subtotal * 0.02);
    const total = subtotal + shippingCost + taxes;

    const handleSaveAddress = async () => {
        if (!customer) return;
        setIsSavingAddress(true);
        const newAddress: Address = {
            id: nanoid(),
            label: newAddressLabel,
            line1: newAddressLine1,
            city: newAddressCity,
            state: newAddressState,
            pincode: newAddressPincode,
        };

        const customerRef = doc(db, 'customers', customer.id);
        try {
            await updateDoc(customerRef, {
                addresses: arrayUnion(newAddress)
            });
            toast({ title: 'Address saved successfully!' });
            setShowNewAddressForm(false);
            setSelectedAddressId(newAddress.id);
            // Reset form
            setNewAddressLabel(''); setNewAddressLine1(''); setNewAddressCity(''); setNewAddressState(''); setNewAddressPincode('');
        } catch (error) {
            console.error("Error saving address: ", error);
            toast({ variant: 'destructive', title: 'Could not save address.' });
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleProceedToPayment = () => {
        if (!customer || !selectedAddressId) {
            toast({ variant: 'destructive', title: 'Please select a shipping address.'});
            return;
        }
        
        const shippingAddress = customer.addresses.find(a => a.id === selectedAddressId);
        if (!shippingAddress) {
             toast({ variant: 'destructive', title: 'Selected address not found.'});
            return;
        }

        setIsProcessing(true);

        // Store order details in localStorage to pass to the payment page
        const orderDetails = {
            cart,
            customerId: customer.id,
            customerName: customer.name,
            customerEmail: customer.email,
            shippingAddress,
            subtotal,
            shippingCost,
            taxes,
            total,
            deliveryMethod: selectedDeliveryMethod,
        };
        localStorage.setItem('checkoutOrderDetails', JSON.stringify(orderDetails));
        
        router.push('/payment');
    }

    if (loading) {
        return (
             <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (cart.length === 0 && !isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                 <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
                 <p className="text-muted-foreground">You can't proceed to checkout without any items.</p>
                 <Button asChild>
                    <Link href="/home#products">Continue Shopping</Link>
                 </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <Breadcrumb>
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                    <Link href="/home">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                    <Link href="/cart">Cart</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Checkout</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Shipping Address */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div>
                                <CardTitle>Shipping Address</CardTitle>
                                <CardDescription>Select or add an address for delivery.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setShowNewAddressForm(true)} disabled={showNewAddressForm}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add New Address
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {customer && customer.addresses.length > 0 && (
                                <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-4">
                                    {customer.addresses.map((address) => (
                                        <Label key={address.id} htmlFor={address.id} className="flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                            <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                                            <div>
                                                <p className="font-semibold">{address.label}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {address.line1}, {address.line2 ? `${address.line2}, ` : ''}
                                                    {address.city}, {address.state} - {address.pincode}
                                                </p>
                                            </div>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            )}

                             {showNewAddressForm && (
                                <div className="p-4 border-t mt-4 space-y-4">
                                     <h3 className="font-semibold">Add a New Address</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="label">Address Label</Label>
                                            <Input id="label" placeholder="e.g., Home, Work Site" value={newAddressLabel} onChange={e => setNewAddressLabel(e.target.value)} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Address Line 1</Label>
                                            <Input id="address" placeholder="123, Blossom Heights, Hiranandani Gardens" value={newAddressLine1} onChange={e => setNewAddressLine1(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" placeholder="Mumbai" value={newAddressCity} onChange={e => setNewAddressCity(e.target.value)} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input id="state" placeholder="Maharashtra" value={newAddressState} onChange={e => setNewAddressState(e.target.value)} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="pincode">PIN Code</Label>
                                            <Input id="pincode" placeholder="400076" value={newAddressPincode} onChange={e => setNewAddressPincode(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSaveAddress} disabled={isSavingAddress}>
                                            {isSavingAddress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save Address
                                        </Button>
                                        <Button variant="ghost" onClick={() => setShowNewAddressForm(false)}>Cancel</Button>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    {/* Delivery Method */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <RadioGroup value={selectedDeliveryMethod} onValueChange={setSelectedDeliveryMethod} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Label htmlFor="standard" className="flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[input:checked]:border-primary">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Package className="h-5 w-5" />
                                            {deliveryOptions.standard.name}
                                        </div>
                                         <RadioGroupItem value="standard" id="standard" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{deliveryOptions.standard.description}</p>
                                    <p className="font-bold text-green-600">FREE</p>
                                </Label>
                                <Label htmlFor="faster" className="flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[input:checked]:border-primary">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Truck className="h-5 w-5" />
                                            {deliveryOptions.faster.name}
                                        </div>
                                         <RadioGroupItem value="faster" id="faster" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{deliveryOptions.faster.description}</p>
                                    <p className="font-bold">₹{deliveryOptions.faster.cost.toFixed(2)}</p>
                                </Label>
                             </RadioGroup>
                        </CardContent>
                    </Card>

                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="relative h-12 w-12">
                                                <Image src={item.product.imageUrl || "https://placehold.co/64x64.png"} alt={item.product.name} fill className="rounded-md object-cover" data-ai-hint="product image"/>
                                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{item.quantity}</span>
                                            </div>
                                            <span>{item.product.name}</span>
                                        </div>
                                        <span className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxes (18%)</span>
                                    <span>₹{taxes.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600 dark:text-green-400">
                                    <span className="flex items-center gap-1 font-medium">
                                        <Star className="h-4 w-4" />
                                        Points You'll Earn
                                    </span>
                                    <span className="font-bold">{pointsEarned}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Button size="lg" className="w-full" onClick={handleProceedToPayment} disabled={!selectedAddressId || isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

    

    