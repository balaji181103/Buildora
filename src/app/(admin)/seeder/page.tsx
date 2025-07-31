
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-client';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
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

const collectionsToManage = [
    { name: 'orders', title: 'Customer Orders', description: 'all customer order history.' },
    { name: 'customers', title: 'Customers', description: 'all customer accounts and data.' },
    { name: 'suppliers', title: 'Suppliers', description: 'all supplier information.' },
    { name: 'products', title: 'Products', description: 'all product listings from inventory.' },
];

export default function SeederPage() {
  const { toast } = useToast();
  const [clearingStates, setClearingStates] = React.useState<Record<string, boolean>>({});

  const handleClearCollection = async (collectionName: string) => {
    setClearingStates(prev => ({ ...prev, [collectionName]: true }));
    try {
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      
      if (querySnapshot.empty) {
        toast({
            title: 'Collection is Already Empty',
            description: `The '${collectionName}' collection has no documents to delete.`,
        });
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      toast({
            title: 'Collection Cleared',
            description: `Successfully deleted ${querySnapshot.size} documents from '${collectionName}'.`,
      });

    } catch (error: any) {
      console.error(`Error clearing ${collectionName}:`, error);
       toast({
            variant: 'destructive',
            title: 'Error Clearing Collection',
            description: `Could not clear '${collectionName}'. See console for details.`,
        });
    } finally {
        setClearingStates(prev => ({ ...prev, [collectionName]: false }));
    }
  };


  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Trash2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">
            Use these utilities to permanently delete data from your Firestore collections. This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {collectionsToManage.map((item) => (
            <Card key={item.name} className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Clear {item.title}
                    </CardTitle>
                    <CardDescription>
                        This will permanently delete {item.description}
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={clearingStates[item.name]}>
                        {clearingStates[item.name] ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Clear {item.title}
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all data from the '{item.name}' collection.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                        onClick={() => handleClearCollection(item.name)}
                        className="bg-destructive hover:bg-destructive/90"
                        >
                        Yes, delete all data
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </CardFooter>
            </Card>
        ))}
      </div>
    </div>
  );
}
