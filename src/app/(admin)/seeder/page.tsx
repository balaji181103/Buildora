
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-client';
import { collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function SeederPage() {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = React.useState(false);

  const clearCollection = async (collectionName: string) => {
    try {
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return { success: true, count: querySnapshot.size };
    } catch (error: any) {
      console.error(`Error clearing ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    const results = await Promise.all([
      clearCollection('orders'),
      clearCollection('customers'),
      clearCollection('suppliers'),
    ]);

    const errors = results.filter(r => !r.success);
    
    if (errors.length > 0) {
        toast({
            variant: 'destructive',
            title: 'Error Clearing Data',
            description: `Could not clear all collections. Please check the console.`,
        });
    } else {
        const totalCount = results.reduce((acc, r) => acc + (r.count || 0), 0);
        toast({
            title: 'Data Cleared Successfully',
            description: `Removed ${totalCount} total documents.`,
        });
    }

    setIsClearing(false);
  };


  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Trash2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">
            Use these utilities to manage your Firestore data.
          </p>
        </div>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Clear Transactional Data
          </CardTitle>
          <CardDescription>
            This will permanently delete all customers, suppliers, and orders
            from your Firestore database. Products will not be affected. This
            action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isClearing}>
                {isClearing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  customers, suppliers, and orders from your database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearData}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, delete all data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
