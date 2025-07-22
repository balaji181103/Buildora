
'use client';

import * as React from 'react';
import { cn } from "@/lib/utils";
import { Check, Package, Rocket, Truck, ClipboardList, CheckCircle2, CircleDot } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

const statusSteps = [
    { name: "Order Placed", status: "Pending" },
    { name: "Processing", status: "Processing" },
    { name: "Out for Delivery", status: "Out for Delivery" },
    { name: "Delivered", status: "Delivered" },
];

export function OrderStatusTracker({ currentStatus, deliveryMethod }: { currentStatus: OrderStatus, deliveryMethod: 'Drone' | 'Truck' }) {
    const currentStepIndex = statusSteps.findIndex(step => step.status === currentStatus);

    const getStepIcon = (index: number) => {
        if (index < currentStepIndex) {
            return <CheckCircle2 className="h-6 w-6 text-primary" />;
        }
        if (index === currentStepIndex) {
            return <CircleDot className="h-6 w-6 text-primary animate-pulse" />;
        }
        return <CircleDot className="h-6 w-6 text-muted-foreground/30" />;
    };

    const getConnectorClass = (index: number) => {
        if (index < currentStepIndex) {
            return "bg-primary";
        }
        return "bg-muted";
    };

    const getDeliveryIcon = () => {
        if (deliveryMethod === 'Drone') {
            return <Rocket className="h-5 w-5" />;
        }
        return <Truck className="h-5 w-5" />;
    }

    const steps = [
        { name: "Order Placed", icon: ClipboardList, status: 'Pending' },
        { name: "Processing", icon: Package, status: 'Processing' },
        { name: "Out for Delivery", icon: getDeliveryIcon(), status: 'Out for Delivery' },
        { name: "Delivered", icon: Check, status: 'Delivered' }
    ];

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
                                {React.cloneElement(step.icon, { className: 'h-6 w-6' })}
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
