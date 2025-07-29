
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Loader2, Upload } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface QrContent {
  paymentQrUrl?: string;
}

export default function QrPage() {
  const { toast } = useToast();
  const [content, setContent] = React.useState<QrContent>({});
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const docRef = doc(db, 'siteContent', 'paymentQr');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data() as QrContent);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/jpg'].includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a PNG, JPG, or WEBP image.',
        });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Image upload failed.' }));
            throw new Error(errorData.message || 'Image upload failed');
        }

        const data = await response.json();
        return data.url;
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Image Upload Error',
            description: error.message,
        });
        return null;
    }
  }

  const handleSave = async () => {
    setIsSaving(true);

    const fileInput = document.getElementById('qr-image-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected' });
      setIsSaving(false);
      return;
    }

    const imageUrl = await uploadImage(file);

    if (imageUrl) {
      try {
        const docRef = doc(db, 'siteContent', 'paymentQr');
        await setDoc(docRef, { paymentQrUrl: imageUrl }, { merge: true });
        
        toast({ title: 'Success', description: 'QR Code image updated successfully.' });
        setPreviewUrl(null);
        fileInput.value = '';
      } catch (error) {
        console.error("Error updating QR code in Firestore:", error);
        toast({ variant: 'destructive', title: 'Firestore Error', description: 'Could not save QR code.' });
      }
    }
    
    setIsSaving(false);
  };
  
  const currentImageUrl = previewUrl || content.paymentQrUrl || 'https://placehold.co/400x400.png';

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="flex items-center gap-4">
        <QrCode className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">QR Management</h1>
          <p className="text-muted-foreground">Manage the QR code for customer payments.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment QR Code</CardTitle>
          <CardDescription>
            Upload the QR code image that will be displayed to customers during checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <div className="relative h-64 w-64 shrink-0">
                  {loading ? (
                    <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
                  ) : (
                    <Image
                      src={currentImageUrl}
                      alt="Payment QR Code Preview"
                      width={256}
                      height={256}
                      className="rounded-lg object-contain border bg-muted"
                      data-ai-hint="qr code"
                    />
                  )}
              </div>
              <div className="space-y-4 w-full">
                <div className="space-y-2">
                    <Label htmlFor="qr-image-upload">Upload New QR Code</Label>
                    <Input id="qr-image-upload" type="file" onChange={handleFileChange} accept="image/*" />
                </div>
                <Button onClick={handleSave} disabled={isSaving || !previewUrl}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Save New QR Code
                </Button>
                <p className="text-xs text-muted-foreground">
                    After uploading, the new QR code will immediately be shown to customers on the payment page.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
