
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface ImageSetting {
  id: string;
  url: string;
}

interface AppearanceContent {
  mainLandingHero?: ImageSetting;
  mainLandingAbout?: ImageSetting;
  customerLandingHero?: ImageSetting;
}

export default function AppearancePage() {
  const { toast } = useToast();
  const [content, setContent] = React.useState<AppearanceContent>({});
  const [loading, setLoading] = React.useState(true);
  const [savingStates, setSavingStates] = React.useState<Record<string, boolean>>({});
  const [previewStates, setPreviewStates] = React.useState<Record<string, string | null>>({});

  React.useEffect(() => {
    const docRef = doc(db, 'siteContent', 'appearance');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data() as AppearanceContent);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof AppearanceContent) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a PNG, JPG, or WEBP image.',
        });
        e.target.value = ''; // Clear the input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewStates(prev => ({ ...prev, [key]: reader.result as string }));
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
            const errorData = await response.json().catch(() => ({ message: 'Image upload failed with no error body.' }));
            throw new Error(errorData.message || 'Image upload failed');
        }

        const data = await response.json();
        return data.url;
    } catch (error: any) {
        console.error('Upload Image Error:', error);
        toast({
            variant: 'destructive',
            title: 'Image Upload Error',
            description: error.message,
        });
        return null;
    }
  }

  const handleSave = async (key: keyof AppearanceContent, inputId: string) => {
    setSavingStates(prev => ({ ...prev, [key]: true }));

    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected' });
      setSavingStates(prev => ({ ...prev, [key]: false }));
      return;
    }

    const imageUrl = await uploadImage(file);

    if (imageUrl) {
      try {
        const docRef = doc(db, 'siteContent', 'appearance');
        await setDoc(docRef, { 
          [key]: { id: key, url: imageUrl } 
        }, { merge: true });
        
        toast({ title: 'Success', description: 'Image updated successfully.' });
        setPreviewStates(prev => ({...prev, [key]: null})); // Clear preview
        fileInput.value = ''; // Reset file input
      } catch (error) {
        console.error("Error updating image URL in Firestore:", error);
        toast({ variant: 'destructive', title: 'Firestore Error', description: 'Could not save image URL.' });
      }
    }
    
    setSavingStates(prev => ({ ...prev, [key]: false }));
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <ImageIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
          <p className="text-muted-foreground">Manage the look and feel of your landing pages.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Main Landing Page</CardTitle>
          <CardDescription>Customize the main public-facing landing page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 divide-y">
          <div className="space-y-2 pt-6 first:pt-0">
            <Label>Hero Image</Label>
            <div className="flex items-center gap-4">
              <Image
                src={previewStates.mainLandingHero || content.mainLandingHero?.url || 'https://placehold.co/1200x800.png'}
                alt="Main landing page hero"
                width={200}
                height={150}
                className="rounded-md object-cover border"
              />
              <div className="space-y-2">
                <Input id="main-hero-image-upload" type="file" onChange={(e) => handleFileChange(e, 'mainLandingHero')} accept="image/*" />
                <Button onClick={() => handleSave('mainLandingHero', 'main-hero-image-upload')} disabled={savingStates.mainLandingHero || !previewStates.mainLandingHero}>
                  {savingStates.mainLandingHero ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Save Hero
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-6 first:pt-0">
            <Label>About Us Image</Label>
            <div className="flex items-center gap-4">
              <Image
                src={previewStates.mainLandingAbout || content.mainLandingAbout?.url || 'https://placehold.co/600x400.png'}
                alt="Main landing page about section"
                width={200}
                height={150}
                className="rounded-md object-cover border"
              />
              <div className="space-y-2">
                <Input id="main-about-image-upload" type="file" onChange={(e) => handleFileChange(e, 'mainLandingAbout')} accept="image/*" />
                <Button onClick={() => handleSave('mainLandingAbout', 'main-about-image-upload')} disabled={savingStates.mainLandingAbout || !previewStates.mainLandingAbout}>
                  {savingStates.mainLandingAbout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Save Image
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Customer Landing Page</CardTitle>
          <CardDescription>Customize the hero section for logged-in customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Customer Hero Image</Label>
            <div className="flex items-center gap-4">
              <Image
                src={previewStates.customerLandingHero || content.customerLandingHero?.url || 'https://placehold.co/600x600.png'}
                alt="Customer landing page hero"
                width={150}
                height={150}
                className="rounded-md object-cover border"
              />
               <div className="space-y-2">
                <Input id="customer-hero-image-upload" type="file" onChange={(e) => handleFileChange(e, 'customerLandingHero')} accept="image/*" />
                <Button onClick={() => handleSave('customerLandingHero', 'customer-hero-image-upload')} disabled={savingStates.customerLandingHero || !previewStates.customerLandingHero}>
                  {savingStates.customerLandingHero ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Save Hero
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
