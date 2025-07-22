
'use client';

import * as React from 'react';
import { cn } from "@/lib/utils";
import { Check, Package, Rocket, Truck, ClipboardList, CheckCircle2, CircleDot } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

const stepsData = [
    { name: "Order Placed", icon: ClipboardList, status: 'Pending' },
    { name: "Processing", icon: Package, status: 'Processing' },
    { name: "Out for Delivery", icon: null, status: 'Out for Delivery' }, // Icon is dynamic
    { name: "Delivered", icon: Check, status: 'Delivered' }
];

export function OrderStatusTracker({ currentStatus, deliveryMethod }: { currentStatus: OrderStatus, deliveryMethod: 'Drone' | 'Truck' }) {
    const getDeliveryIcon = React.useCallback(() => {
        if (deliveryMethod === 'Drone') {
            return <Rocket className="h-5 w-5" />;
        }
        return <Truck className="h-5 w-5" />;
    }, [deliveryMethod]);

    const steps = React.useMemo(() => {
        return stepsData.map(step => 
            step.status === 'Out for Delivery' ? { ...step, icon: getDeliveryIcon() } : step
        );
    }, [getDeliveryIcon]);

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
                                {step.icon ? React.cloneElement(step.icon, { className: 'h-6 w-6' }) : null}
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
