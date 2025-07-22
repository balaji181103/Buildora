
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { allOrders, products as allProducts, drones, trucks, customers } from '@/lib/data';
import { OrderStatusTracker } from '@/components/ui/order-status-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map, Waypoints, AlertTriangle, Battery, Gauge, User, HelpCircle, Rocket, Truck as TruckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CustomerOrderTrackingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const order = allOrders.find(o => o.id === params.id);
  
  if (!order) {
    notFound();
  }

  const vehicle = order.deliveryMethod === 'Drone'
    ? drones.find(d => d.id === order.deliveryVehicleId)
    : trucks.find(t => t.id === order.deliveryVehicleId);

  const customer = customers.find(c => c.name === order.customer);
  
  const renderVehicleDetails = () => {
    if (order.deliveryMethod === 'Drone' && vehicle) {
      const drone = vehicle as typeof drones[0];
      return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5" /> Drone Details</CardTitle>
                <Badge variant="outline">{drone.id}</Badge>
            </div>
            <div className="text-sm space-y-2">
                <p className="flex justify-between"><span>Status:</span> <span className="font-medium">{drone.status}</span></p>
                <p className="flex justify-between"><span>Current Location:</span> <span className="font-medium">{drone.location}</span></p>
            </div>
        </div>
      );
    }
    if (order.deliveryMethod === 'Truck' && vehicle) {
        const truck = vehicle as typeof trucks[0];
        return (
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><TruckIcon className="h-5 w-5" /> Truck Details</CardTitle>
                    <Badge variant="outline">{truck.id}</Badge>
                </div>
                <div className="text-sm space-y-2">
                    <p className="flex justify-between"><span>Status:</span> <span className="font-medium">{truck.status}</span></p>
                     <p className="flex justify-between"><span>Current Location:</span> <span className="font-medium">{truck.location}</span></p>
                </div>
            </div>
        );
    }
    return <p>Vehicle details not found.</p>;
  }

  const renderAlerts = () => {
      if (order.deliveryMethod === 'Drone') {
          return (
             <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                <div>
                    <p className="font-semibold text-yellow-700">Weather Advisory</p>
                    <p className="text-sm text-yellow-600">High winds detected. Drone speed has been reduced for safety. Minor delay expected.</p>
                </div>
            </div>
          )
      }
      return (
         <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
            <div>
                <p className="font-semibold text-red-700">Delivery Delay</p>
                <p className="text-sm text-red-600">Truck TR-01 is experiencing traffic delays. Estimated arrival is now 3:45 PM.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Orders</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Track Order</h1>
          <p className="text-muted-foreground">Order ID: {order.id}</p>
        </div>
      </div>
      
      <OrderStatusTracker currentStatus={order.status} deliveryMethod={order.deliveryMethod} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5"/> Delivery Map</CardTitle>
                    <CardDescription>Real-time location of your delivery.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
                         <Image src="https://placehold.co/800x450.png" alt="Map view of delivery route" layout="fill" objectFit="cover" data-ai-hint="map delivery" />
                         <div className="absolute top-1/4 left-1/4">
                            {order.deliveryMethod === 'Drone' ? 
                                <Rocket className="h-8 w-8 text-primary drop-shadow-lg animate-pulse" /> : 
                                <TruckIcon className="h-8 w-8 text-primary drop-shadow-lg animate-pulse" />
                            }
                         </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    {renderVehicleDetails()}
                </CardHeader>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {renderAlerts()}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                 <CardContent className="grid gap-2">
                     <Button variant="outline" className="w-full justify-start gap-2">
                        <HelpCircle className="h-4 w-4" /> Contact Support
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
