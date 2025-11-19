
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calculator, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase-client';
import { doc, onSnapshot } from 'firebase/firestore';


// --- Cement Estimation ---
const cementSchema = z.object({
  length: z.coerce.number().positive('Length must be positive'),
  width: z.coerce.number().positive('Width must be positive'),
  thickness: z.coerce.number().positive('Thickness must be positive'),
});
type CementFormValues = z.infer<typeof cementSchema>;

// --- Brick Estimation ---
const brickSchema = z.object({
  length: z.coerce.number().positive('Length must be positive'),
  height: z.coerce.number().positive('Height must be positive'),
  brickType: z.enum(['red_brick', 'alo_block'], {
    required_error: "You need to select a brick type."
  }),
});
type BrickFormValues = z.infer<typeof brickSchema>;

export function MaterialEstimator() {
  const [cementResult, setCementResult] = React.useState<number | null>(null);
  const [brickResult, setBrickResult] = React.useState<number | null>(null);
  const [redBrickUrl, setRedBrickUrl] = React.useState('https://placehold.co/80x80.png');
  const [aacBlockUrl, setAacBlockUrl] = React.useState('https://placehold.co/80x80.png');

  React.useEffect(() => {
    const docRef = doc(db, 'siteContent', 'appearance');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.estimatorRedBrick?.url) {
                setRedBrickUrl(data.estimatorRedBrick.url);
            }
            if (data.estimatorAacBlock?.url) {
                setAacBlockUrl(data.estimatorAacBlock.url);
            }
        }
    });
    return () => unsubscribe();
  }, []);

  const cementForm = useForm<CementFormValues>({
    resolver: zodResolver(cementSchema),
    defaultValues: {
      length: 0,
      width: 0,
      thickness: 0,
    }
  });

  const brickForm = useForm<BrickFormValues>({
    resolver: zodResolver(brickSchema),
     defaultValues: {
      length: 0,
      height: 0,
    }
  });

  const onCementSubmit = (data: CementFormValues) => {
    // 1. Calculate volume in cubic feet
    const volumeCft = data.length * data.width * (data.thickness / 12);
    // 2. Convert to cubic meters (1 cft = 0.0283168 m³)
    const volumeCbm = volumeCft * 0.0283168;
    // 3. Increase volume by ~54% to get dry volume from wet volume
    const dryVolume = volumeCbm * 1.54;
    // 4. For M20 grade concrete (1:1.5:3 ratio), sum of ratio is 1+1.5+3 = 5.5
    const sumOfRatio = 5.5;
    // 5. Volume of cement = (Dry Volume * Cement Ratio) / Sum of Ratio
    const cementVolume = (dryVolume * 1) / sumOfRatio;
    // 6. Density of cement is ~1440 kg/m³
    const cementWeight = cementVolume * 1440;
    // 7. Standard cement bag is 50kg
    const bags = Math.ceil(cementWeight / 50);
    setCementResult(bags);
  };

  const onBrickSubmit = (data: BrickFormValues) => {
    const wallAreaSqFt = data.length * data.height;

    let brickAreaWithMortar: number; // in sq ft
    if (data.brickType === 'red_brick') {
      // Standard red brick: 9" x 4.5" x 3" -> with 0.5" mortar becomes 9.5" x 3.5"
      brickAreaWithMortar = (9.5 * 3.5) / 144; // area in sq ft
    } else {
      // Alo/AAC block: 24" x 8" x (4", 6", 8") -> with 0.5" mortar becomes 24.5" x 8.5"
      brickAreaWithMortar = (24.5 * 8.5) / 144; // area in sq ft
    }

    const numberOfBricks = Math.ceil(wallAreaSqFt / brickAreaWithMortar);
    setBrickResult(numberOfBricks);
  };

  return (
    <Card id="estimator" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-6 w-6" /> Material Estimator
        </CardTitle>
        <CardDescription>
          Calculate required materials for your project. Note: These are
          estimates. Consult with an engineer for precise calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cement">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cement">Cement for Roof Concrete</TabsTrigger>
            <TabsTrigger value="bricks">Bricks for Wall</TabsTrigger>
          </TabsList>
          <TabsContent value="cement" className="mt-6">
            <Form {...cementForm}>
              <form
                onSubmit={cementForm.handleSubmit(onCementSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={cementForm.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roof Length (ft)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={cementForm.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roof Width (ft)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={cementForm.control}
                    name="thickness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roof Thickness (in)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit">Calculate Cement</Button>
              </form>
            </Form>
            {cementResult !== null && (
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Estimated Cement Required</AlertTitle>
                <AlertDescription>
                  You will need approximately{' '}
                  <span className="font-bold">{cementResult} bags</span> of
                  cement (50kg each) for a standard M20 grade roof concrete.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="bricks" className="mt-6">
            <Form {...brickForm}>
              <form
                onSubmit={brickForm.handleSubmit(onBrickSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={brickForm.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wall Length (ft)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={brickForm.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wall Height (ft)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                 <FormField
                  control={brickForm.control}
                  name="brickType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Brick/Block Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <FormItem>
                            <Label htmlFor="red_brick" className="block cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm has-[:checked]:border-primary">
                                <RadioGroupItem value="red_brick" id="red_brick" className="sr-only" />
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Image src={redBrickUrl} alt="Red brick" width={80} height={80} className="rounded-md" data-ai-hint="red brick" />
                                    <div>
                                        <h3 className="font-semibold">Red Brick</h3>
                                        <p className="text-sm text-muted-foreground">Size: 9" x 4.5" x 3"</p>
                                    </div>
                                </CardContent>
                            </Label>
                          </FormItem>
                          <FormItem>
                            <Label htmlFor="alo_block" className="block cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm has-[:checked]:border-primary">
                               <RadioGroupItem value="alo_block" id="alo_block" className="sr-only" />
                               <CardContent className="p-4 flex items-center gap-4">
                                    <Image src={aacBlockUrl} alt="ALO/AAC Block" width={80} height={80} className="rounded-md" data-ai-hint="concrete block" />
                                    <div>
                                        <h3 className="font-semibold">ALO/AAC Block</h3>
                                        <p className="text-sm text-muted-foreground">Size: 24" x 8" x 4-8"</p>
                                    </div>
                                </CardContent>
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Calculate Bricks</Button>
              </form>
            </Form>
            {brickResult !== null && (
              <Alert className="mt-6">
                 <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Estimated Bricks/Blocks Required</AlertTitle>
                <AlertDescription>
                  You will need approximately{' '}
                  <span className="font-bold">{brickResult} units</span> for your wall.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
