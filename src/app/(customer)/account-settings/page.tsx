
'use client'

import * as React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Loader2, Trash2, PlusCircle } from "lucide-react"
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Customer, Address } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';

function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
         <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">Full Name</Label>
            <Skeleton className="h-10 w-full" />
          </div>
            <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardContent>
          <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</Button>
      </CardContent>
    </Card>
  );
}

export default function CustomerSettingsPage() {
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSavingAddress, setIsSavingAddress] = React.useState(false);

  // States for the profile form fields
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  // States for new address form
  const [showNewAddressForm, setShowNewAddressForm] = React.useState(false);
  const [newAddressLabel, setNewAddressLabel] = React.useState('');
  const [newAddressLine1, setNewAddressLine1] = React.useState('');
  const [newAddressCity, setNewAddressCity] = React.useState('');
  const [newAddressState, setNewAddressState] = React.useState('');
  const [newAddressPincode, setNewAddressPincode] = React.useState('');


  React.useEffect(() => {
    const customerId = localStorage.getItem('loggedInCustomerId');
    if (!customerId) {
      setLoading(false);
      return;
    }

    const fetchCustomer = async () => {
      const docRef = doc(db, 'customers', customerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const customerData = { id: docSnap.id, ...docSnap.data() } as Customer;
        setCustomer(customerData);
        setName(customerData.name);
        setEmail(customerData.email);
        setPhone(customerData.phone);
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchCustomer();
  }, []);
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0]?.[0] || '';
  };


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a PNG, JPG, or WEBP image.',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

   async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Image upload failed.' }));
            throw new Error(errorData.message || 'Image upload failed');
        }

        const data = await response.json();
        return data.url;
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Image Upload Error',
            description: error.message,
        });
        return null;
    }
  }

  const handleSaveChanges = async () => {
    if (!customer) return;
    setIsSaving(true);
    
    let profilePictureUrl = customer.profilePictureUrl;

    if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
            profilePictureUrl = uploadedUrl;
        } else {
            setIsSaving(false);
            return; // Stop if upload fails
        }
    }

    const customerRef = doc(db, 'customers', customer.id);
    try {
      await updateDoc(customerRef, {
        name: name,
        email: email,
        phone: phone,
        profilePictureUrl: profilePictureUrl,
      });
      setCustomer(prev => prev ? {...prev, profilePictureUrl, name, email, phone} : null); // Update local state
      setImageFile(null);
      setImagePreview(null);
      toast({ title: 'Success', description: 'Profile updated successfully.' });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update profile.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveNewAddress = async () => {
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
        
        setCustomer(prev => prev ? {...prev, addresses: [...prev.addresses, newAddress]} : null);

        toast({ title: 'Address saved successfully!' });
        setShowNewAddressForm(false);
        // Reset form
        setNewAddressLabel(''); setNewAddressLine1(''); setNewAddressCity(''); setNewAddressState(''); setNewAddressPincode('');
    } catch (error) {
        console.error("Error saving address: ", error);
        toast({ variant: 'destructive', title: 'Could not save address.' });
    } finally {
        setIsSavingAddress(false);
    }
  };


  const handleDeleteAddress = async (addressId: string) => {
    if (!customer) return;

    const addressToRemove = customer.addresses.find(addr => addr.id === addressId);
    if (!addressToRemove) return;

    const customerRef = doc(db, 'customers', customer.id);
    try {
      await updateDoc(customerRef, {
        addresses: arrayRemove(addressToRemove)
      });

      setCustomer(prevCustomer => {
        if (!prevCustomer) return null;
        return {
          ...prevCustomer,
          addresses: prevCustomer.addresses.filter(addr => addr.id !== addressId)
        };
      });

      toast({
        title: 'Address Removed',
        description: 'The selected address has been deleted.',
      });
    } catch (error) {
      console.error("Error removing address:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not remove the address. Please try again.',
      });
    }
  };
  
  const currentImageUrl = imagePreview || customer?.profilePictureUrl;

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, addresses, and notification preferences.</p>
      </div>
      <div className="grid gap-8">
        {loading ? (
           <ProfileSkeleton />
        ) : !customer ? (
            <p>Please log in to view your settings.</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center gap-4">
                 <Dialog>
                    <DialogTrigger asChild disabled={!currentImageUrl}>
                        <Avatar className="h-20 w-20 cursor-pointer">
                            <AvatarImage src={currentImageUrl} alt={customer.name} />
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                    </DialogTrigger>
                    {currentImageUrl && (
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{name}'s Profile Picture</DialogTitle>
                            </DialogHeader>
                            <Image src={currentImageUrl} alt={customer.name} width={500} height={500} className="rounded-md object-contain" />
                        </DialogContent>
                    )}
                 </Dialog>

                <Input id="picture" type="file" className="max-w-xs" onChange={handleImageChange} accept="image/*" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardContent>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manage Addresses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manage Addresses</CardTitle>
                <CardDescription>Add or remove delivery addresses.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowNewAddressForm(true)} disabled={showNewAddressForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Address
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <Skeleton className="h-20 w-full" /> : 
            customer?.addresses && customer.addresses.length > 0 ? (
                customer.addresses.map(address => (
                     <div key={address.id} className="rounded-lg border p-4 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Home className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{address.label}</p>
                                <p className="text-sm text-muted-foreground">{address.line1}, {address.city} - {address.pincode}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(address.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))
            ) : (
                 !showNewAddressForm && <p className="text-sm text-muted-foreground text-center py-4">You have no saved addresses.</p>
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
                        <Button onClick={handleSaveNewAddress} disabled={isSavingAddress}>
                            {isSavingAddress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Address
                        </Button>
                        <Button variant="ghost" onClick={() => setShowNewAddressForm(false)}>Cancel</Button>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
        
        {/* Notification Preferences Card */}
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="email-notifications" className="font-semibold">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates about your orders and promotions.</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="sms-notifications" className="font-semibold">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get real-time delivery updates on your phone.</p>
                    </div>
                    <Switch id="sms-notifications" />
                </div>
            </CardContent>
        </Card>

         {/* Delete Account Card */}
         <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive">Delete My Account</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
