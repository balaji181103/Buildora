
'use client';

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CreditCard, Home, PlusCircle, Rocket, Truck, LocateFixed, Loader2 } from "lucide-react"
import { customers } from "@/lib/data" // Assuming we get the logged in customer's data
import { useToast } from "@/hooks/use-toast";

const deliveryOptions = {
    standard: { name: 'Standard', cost: 500, description: '2-3 Business Days (For heavy items)', icon: Truck },
    express: { name: 'Express Drone', cost: 1200, description: 'Within 24 Hours (For light items)', icon: Rocket },
};

export default function CheckoutPage() {
    const { cart } = useCart();
    const { toast } = useToast();
    const [selectedAddressId, setSelectedAddressId] = React.useState<string | undefined>(undefined);
    const [showNewAddressForm, setShowNewAddressForm] = React.useState(false);
    const [isLocating, setIsLocating] = React.useState(false);
    const [latitude, setLatitude] = React.useState<number | null>(null);
    const [longitude, setLongitude] = React.useState<number | null>(null);

    // In a real app, you'd fetch the logged-in user. We'll use the first customer as a mock.
    const customer = customers[0]; 

    const totalWeight = React.useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.product.weight * item.quantity), 0);
    }, [cart]);

    const isDroneDeliveryAvailable = totalWeight <= 5;
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = React.useState(
        isDroneDeliveryAvailable ? 'express' : 'standard'
    );
     
    const handleGetLocation = React.useCallback(() => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Geolocation is not supported by your browser.' });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setIsLocating(false);
                toast({ title: 'Location captured successfully!' });
            },
            (error) => {
                console.error("Location access denied or unavailable", error);
                toast({ variant: 'destructive', title: 'Could not get location.', description: 'Please ensure location access is enabled for this site.' });
                setIsLocating(false);
            }
        );
    }, [toast]);

    const handleUseCurrentLocation = () => {
        setShowNewAddressForm(true);
        handleGetLocation();
    }


    React.useEffect(() => {
        if (!isDroneDeliveryAvailable) {
            setSelectedDeliveryMethod('standard');
        }
    }, [isDroneDeliveryAvailable]);

    React.useEffect(() => {
        if (customer.addresses && customer.addresses.length > 0) {
            setSelectedAddressId(customer.addresses[0].id);
        } else {
            setShowNewAddressForm(true);
        }
    }, [customer]);


    const subtotal = React.useMemo(() => {
        return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    }, [cart]);

    const shippingCost = deliveryOptions[selectedDeliveryMethod as keyof typeof deliveryOptions]?.cost || 0;
    const taxes = subtotal * 0.18; // Mock 18% tax
    const total = subtotal + shippingCost + taxes;

    if (cart.length === 0) {
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
                                <Button variant="outline" size="sm" onClick={handleUseCurrentLocation}>
                                    <LocateFixed className="mr-2 h-4 w-4" />
                                    Current Address
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowNewAddressForm(true)} disabled={showNewAddressForm}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add New Address
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                             {showNewAddressForm && (
                                <div className="p-4 border-t mt-4 space-y-4">
                                     <h3 className="font-semibold">Add a New Address</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" placeholder="Priya Sharma" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" placeholder="+91 98765 43210" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Address Line 1</Label>
                                            <Input id="address" placeholder="123, Blossom Heights, Hiranandani Gardens" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" placeholder="Mumbai" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input id="state" placeholder="Maharashtra" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="pincode">PIN Code</Label>
                                            <Input id="pincode" placeholder="400076" />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-md border bg-muted/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-medium">Precise Location (Optional)</Label>
                                             <Button type="button" variant="secondary" size="sm" onClick={handleGetLocation} disabled={isLocating}>
                                                {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
                                                {isLocating ? 'Locating...' : 'Get Current Location'}
                                            </Button>
                                        </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="latitude">Latitude</Label>
                                                <Input id="latitude" readOnly value={latitude ?? ''} placeholder="e.g. 19.1176" />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="longitude">Longitude</Label>
                                                <Input id="longitude" readOnly value={longitude ?? ''} placeholder="e.g. 72.9060" />
                                            </div>
                                         </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button>Save Address</Button>
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
                            <CardDescription>Total cart weight: {totalWeight.toFixed(2)}kg. {isDroneDeliveryAvailable ? "Drone delivery is available." : "Drone delivery unavailable for orders over 5kg."}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <RadioGroup value={selectedDeliveryMethod} onValueChange={setSelectedDeliveryMethod} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Label htmlFor="standard" className="flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[input:checked]:border-primary">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Truck className="h-5 w-5" />
                                            {deliveryOptions.standard.name}
                                        </div>
                                         <RadioGroupItem value="standard" id="standard" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{deliveryOptions.standard.description}</p>
                                    <p className="font-bold">₹{deliveryOptions.standard.cost.toFixed(2)}</p>
                                </Label>
                                 <Label htmlFor="express" className={`flex flex-col gap-2 rounded-lg border p-4 ${isDroneDeliveryAvailable ? 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary' : 'cursor-not-allowed bg-muted/50 opacity-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Rocket className="h-5 w-5" />
                                            {deliveryOptions.express.name}
                                        </div>
                                         <RadioGroupItem value="express" id="express" disabled={!isDroneDeliveryAvailable} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{deliveryOptions.express.description}</p>
                                    <p className="font-bold">₹{deliveryOptions.express.cost.toFixed(2)}</p>
                                </Label>
                             </RadioGroup>
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                     <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                            <CardDescription>Choose your preferred payment method.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="single" collapsible defaultValue="card">
                                <AccordionItem value="card">
                                    <AccordionTrigger className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Credit/Debit Card
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="card-number">Card Number</Label>
                                            <Input id="card-number" placeholder="1234 5678 9012 3456" />
                                        </div>
                                         <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label htmlFor="expiry">Expiration Date</Label>
                                                <Input id="expiry" placeholder="MM / YY" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvc">CVC</Label>
                                                <Input id="cvc" placeholder="123" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="card-name">Name on Card</Label>
                                            <Input id="card-name" placeholder="Priya Sharma" />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="upi-apps">
                                    <AccordionTrigger className="font-semibold">
                                        <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.533c-5.43.54-9.43-3.46-9.973-8.893A9.453 9.453 0 0 1 11.56 1.57a9.453 9.453 0 0 1 10.873 10.873 9.453 9.453 0 0 1-10.433 8.09zM8 8l8 8"/><path d="m8 16 8-8"/></svg>
                                            UPI Apps
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 grid grid-cols-3 gap-4">
                                        <Button variant="outline">GPay</Button>
                                        <Button variant="outline">PhonePe</Button>
                                        <Button variant="outline">Paytm</Button>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="upi-id">
                                    <AccordionTrigger className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="m22 12-4-4 4-4"/><path d="M2 12h16"/></svg>
                                            Enter UPI ID
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-2">
                                        <Label htmlFor="upi-id">Your UPI ID</Label>
                                        <Input id="upi-id" placeholder="yourname@bank" />
                                        <Button>Verify & Pay</Button>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
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
                                                <Image src="https://placehold.co/64x64.png" alt={item.product.name} fill className="rounded-md object-cover" data-ai-hint="product image"/>
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
                                    <span>₹{shippingCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxes (18%)</span>
                                    <span>₹{taxes.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Button size="lg" className="w-full">Place Order</Button>
                </div>
            </div>
        </div>
    )

    




    