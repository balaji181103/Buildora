'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMaintenanceLog } from '@/app/actions/predictive-maintenance';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PredictiveMaintenanceLogInputSchema = z.object({
  droneId: z.string().min(1, 'Drone ID is required.'),
  flightHours: z.coerce.number().min(0, 'Flight hours must be a positive number.'),
  lastMaintenanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  environmentConditions: z.string().min(1, 'Environmental conditions are required.'),
  sensorReadings: z.string().min(1, 'Sensor readings are required.'),
});

type MaintenanceFormValues = z.infer<typeof PredictiveMaintenanceLogInputSchema>;

export function MaintenanceForm({ droneId: initialDroneId }: { droneId?: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(PredictiveMaintenanceLogInputSchema),
    defaultValues: {
      droneId: initialDroneId || '',
      flightHours: 0,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      environmentConditions: 'Standard urban, moderate temperature, low humidity.',
      sensorReadings: 'Motor temps: 45-55C, Battery voltage: stable at 22.2V, GPS signal: strong.',
    },
  });

  function onSubmit(values: MaintenanceFormValues) {
    startTransition(async () => {
      setResult(null);
      const response = await getMaintenanceLog(values);
      if (response.success) {
        setResult(response.log);
        toast({
          title: "Success",
          description: "Maintenance log generated successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error,
        });
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="droneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drone ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SB-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flightHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Flight Hours</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="lastMaintenanceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Maintenance Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="environmentConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Environmental Conditions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe typical operating conditions..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sensorReadings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recent Sensor Readings</FormLabel>
                <FormControl>
                  <Textarea placeholder="Provide recent sensor data..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Generating...' : 'Generate Log'}
          </Button>
        </form>
      </Form>
      {(isPending || result) && (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Generated Maintenance Log</CardTitle>
                <CardDescription>AI-powered analysis and recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
                {isPending && (
                    <div className="flex items-center space-x-4">
                        <div className="space-y-2 w-full">
                            <div className="animate-pulse bg-muted h-4 w-3/4 rounded-md"></div>
                            <div className="animate-pulse bg-muted h-4 w-full rounded-md"></div>
                            <div className="animate-pulse bg-muted h-4 w-1/2 rounded-md"></div>
                        </div>
                    </div>
                )}
                {result && (
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Drone Analysis Report</AlertTitle>
                    <AlertDescription>
                        <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-slate-950 p-4 font-mono text-sm text-slate-50">
                            {result}
                        </pre>
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
        </Card>
      )}
    </>
  );
}
