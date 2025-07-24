
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wand2, ArrowLeft, Bot } from 'lucide-react';
import { getMaintenanceLog } from '@/ai/flows/get-maintenance-log';

export default function AiToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const droneId = searchParams.get('droneId');
  const [log, setLog] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateLog = async () => {
    if (!droneId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMaintenanceLog(droneId);
      setLog(result);
    } catch (e) {
      setError('Failed to generate maintenance log. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <div className="flex items-center gap-2">
                 <Bot className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">AI Drone Maintenance Tool</h1>
            </div>
          <p className="text-muted-foreground">
            Generate predictive maintenance logs for your drones.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Log for Drone: {droneId || 'N/A'}</CardTitle>
          <CardDescription>
            Click the button below to use AI to generate a predictive maintenance log based on the drone's (mock) history and specifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateLog} disabled={isLoading || !droneId}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Predictive Log
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {log && (
            <div className="space-y-2 pt-4">
                <h3 className="font-semibold">Generated Maintenance Log:</h3>
                <Textarea
                    readOnly
                    value={log}
                    className="h-64 w-full rounded-md border bg-muted p-4 font-mono text-sm"
                    placeholder="Generated log will appear here..."
                />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
