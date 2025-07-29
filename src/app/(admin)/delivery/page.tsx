
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function DeliveryPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    Delivery Management
                </CardTitle>
                <CardDescription>
                    Monitor and manage ongoing deliveries. This feature is under construction.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Delivery tracking and management features are coming soon.</p>
                </div>
            </CardContent>
        </Card>
    )
}
