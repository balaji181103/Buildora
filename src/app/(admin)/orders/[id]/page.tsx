'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map, Waypoints, AlertTriangle, Battery, Gauge, User, MessageSquare, Undo2, Rocket, Truck as TruckIcon, Video, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { db } from '@/lib/firebase-client';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Order, Customer, Drone, Truck } from '@/lib/types';


export default function AdminOrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isVideoOpen, setIsVideoOpen] = React.useState(false);
  
  const [order, setOrder] = React.useState<Order | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [vehicle, setVehicle] = React.useState<Drone | Truck | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!id) return;
    const unsubscribeOrder = onSnapshot(doc(db, "orders", id), async (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setOrder(orderData);
        
        // Fetch customer details
        const unsubCustomer = onSnapshot(doc(db, "customers", orderData.customerId), (custSnap) => {
             if (custSnap.exists()) {
                 setCustomer({ id: custSnap.id, ...custSnap.data() } as Customer);
             }
        });

        // Fetch vehicle details
        if (orderData.deliveryVehicleId) {
            const vehicleCollection = orderData.deliveryMethod === 'Drone' ? 'drones' : 'trucks';
            const unsubVehicle = onSnapshot(doc(db, vehicleCollection, orderData.deliveryVehicleId), (vehicleSnap) => {
                if (vehicleSnap.exists()) {
                    setVehicle(vehicleSnap.data() as Drone | Truck);
                }
                setLoading(false);
            });
            return () => {
                unsubCustomer();
                unsubVehicle();
            };
        } else {
            setLoading(false);
        }
        
      } else {
        notFound();
      }
    });

    return () => unsubscribeOrder();
  }, [id]);


  if (loading || !order) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const renderVehicleDetails = () => {
    if (!vehicle) return <p>Vehicle details not found.</p>;

    if (order.deliveryMethod === 'Drone') {
      const drone = vehicle as Drone;
      return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5" /> Drone Details</CardTitle>
                <Badge variant="outline">{drone.id}</Badge>
            </div>
            <div className="text-sm space-y-2">
                <p className="flex justify-between"><span>Status:</span> <span className="font-medium">{drone.status}</span></p>
                <p className="flex justify-between"><span>Battery:</span> <span className="font-medium flex items-center gap-2"><Battery className="h-4 w-4" /> {drone.battery}%</span></p>
                <p className="flex justify-between"><span>Speed:</span> <span className="font-medium flex items-center gap-2"><Gauge className="h-4 w-4" /> 45 km/h</span></p>
                <p className="flex justify-between"><span>Location:</span> <span className="font-medium">{drone.location}</span></p>
            </div>
        </div>
      );
    }
    if (order.deliveryMethod === 'Truck') {
        const truck = vehicle as Truck;
        return (
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><TruckIcon className="h-5 w-5" /> Truck Details</CardTitle>
                    <Badge variant="outline">{truck.id}</Badge>
                </div>
                <div className="text-sm space-y-2">
                    <p className="flex justify-between"><span>Status:</span> <span className="font-medium">{truck.status}</span></p>
                    <p className="flex justify-between"><span>Speed:</span> <span className="font-medium flex items-center gap-2"><Gauge className="h-4 w-4" /> 60 km/h</span></p>
                    <p className="flex justify-between"><span>Location:</span> <span className="font-medium">{truck.location}</span></p>
                    <p className="flex justify-between"><span>Mileage:</span> <span className="font-medium">{truck.mileage.toLocaleString()} km</span></p>
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
                    <p className="font-semibold text-yellow-700">Low Battery</p>
                    <p className="text-sm text-yellow-600">Drone SB-002 battery at 18%. Risk of return-to-home failure.</p>
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

  const renderActions = () => {
    return (
        <div className="grid grid-cols-2 gap-2">
            {order.deliveryMethod === 'Drone' && (
                <>
                    <Button variant="outline" onClick={() => setIsVideoOpen(true)}><Video className="mr-2 h-4 w-4" /> View Live Feed</Button>
                    <Button variant="outline"><Undo2 className="mr-2 h-4 w-4" /> Recall Drone</Button>
                </>
            )}
            <Button variant="outline" className={order.deliveryMethod === 'Truck' ? "col-span-2" : "col-span-2"}>
                <MessageSquare className="mr-2 h-4 w-4" /> Message Customer
            </Button>
        </div>
    )
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Waypoints className="h-6 w-6" /> Live Order Tracking</h1>
            <p className="text-muted-foreground">Monitoring Order ID: {order.id}</p>
            </div>
        </div>
        <Badge variant="secondary" className="text-base py-1 px-3">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5"/> Delivery Map</CardTitle>
                    <CardDescription>Real-time location of the delivery vehicle.</CardDescription>
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
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Customer Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold">{customer?.name}</p>
                    <p className="text-sm text-muted-foreground">{customer?.email}</p>
                    <Link href={`/customers/${customer?.id}`} className="text-sm text-primary hover:underline mt-2 inline-block">View Full Profile</Link>
                </CardContent>
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
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderActions()}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Live Feed: {order.deliveryVehicleId}</DialogTitle>
                <DialogDescription>
                    Real-time video footage from the drone.
                </DialogDescription>
            </DialogHeader>
            <div className="aspect-video bg-black rounded-lg">
                <p className="text-muted-foreground h-full flex items-center justify-center">Video feed placeholder</p>
                {/* In a real app, a video player component would go here */}
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
