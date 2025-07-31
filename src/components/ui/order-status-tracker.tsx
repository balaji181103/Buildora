
'use client';

import * as React from 'react';
import { cn } from "@/lib/utils";
import { Check, Package, ClipboardList, PackageCheck, Warehouse, Truck } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

const stepsData: { name: string; icon: React.ReactNode; status: OrderStatus }[] = [
    { name: "Order Placed", icon: <ClipboardList className="h-6 w-6" />, status: 'Pending' },
    { name: "Processing", icon: <Package className="h-6 w-6" />, status: 'Processing' },
    { name: "At Hub", icon: <Warehouse className="h-6 w-6" />, status: 'At Hub' },
    { name: "Out for Delivery", icon: <Truck className="h-6 w-6" />, status: 'Out for Delivery' },
    { name: "Delivered", icon: <PackageCheck className="h-6 w-6" />, status: 'Delivered' }
];

export function OrderStatusTracker({ currentStatus }: { currentStatus: OrderStatus }) {

    // Handle 'Cancelled' status by showing no progress
    if (currentStatus === 'Cancelled') {
        return (
            <div className="p-6 bg-card rounded-lg border text-center">
                <p className="text-lg font-semibold text-destructive">Order Cancelled</p>
            </div>
        );
    }

    const steps = stepsData;

    const activeStepIndex = Math.max(0, steps.findIndex(s => s.status === currentStatus));

    return (
        <div className="p-6 bg-card rounded-lg border">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.name}>
                        <div className="flex flex-col items-center gap-2 text-center w-full">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300",
                                index <= activeStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {step.icon}
                            </div>
                            <p className={cn(
                                "text-sm font-medium transition-colors duration-300",
                                index <= activeStepIndex ? "text-foreground" : "text-muted-foreground"
                            )}>{step.name}</p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "flex-auto h-1 transition-colors duration-500 mx-4",
                                index < activeStepIndex ? "bg-primary" : "bg-muted"
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}
