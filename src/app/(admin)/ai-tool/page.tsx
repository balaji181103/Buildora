import { MaintenanceForm } from './maintenance-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function AiToolPage({ searchParams }: { searchParams: { droneId?: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Wrench className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Predictive Maintenance AI</h1>
            <p className="text-muted-foreground">
                Generate predictive maintenance logs for your drones using AI.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Generate New Log</CardTitle>
            <CardDescription>Fill in the drone's operational data to generate a new predictive maintenance report.</CardDescription>
        </CardHeader>
        <CardContent>
            <MaintenanceForm droneId={searchParams.droneId} />
        </CardContent>
      </Card>
    </div>
  );
}
