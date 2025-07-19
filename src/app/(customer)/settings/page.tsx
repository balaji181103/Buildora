
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Home, Trash2 } from "lucide-react"

export default function CustomerSettingsPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, addresses, and notification preferences.</p>
      </div>
      <div className="grid gap-8">
        {/* Edit Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" defaultValue="Priya" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" defaultValue="Sharma" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="priya.sharma@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="+91 98765 43210" />
            </div>
          </CardContent>
          <CardContent>
             <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>For your security, we recommend using a strong password.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
          </CardContent>
           <CardContent>
             <Button>Update Password</Button>
          </CardContent>
        </Card>

        {/* Manage Addresses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manage Addresses</CardTitle>
                <CardDescription>Add or remove delivery addresses.</CardDescription>
            </div>
            <Button>Add New Address</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Home className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Main Residence</p>
                        <p className="text-sm text-muted-foreground">123, Blossom Heights, Hiranandani Gardens, Powai, Mumbai - 400076</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
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
