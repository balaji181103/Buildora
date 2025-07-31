
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  brickType: z.enum(['red_brick', 'alo_block']),
});
type BrickFormValues = z.infer<typeof brickSchema>;

export function MaterialEstimator() {
  const [cementResult, setCementResult] = React.useState<number | null>(null);
  const [brickResult, setBrickResult] = React.useState<number | null>(null);

  const cementForm = useForm<CementFormValues>({
    resolver: zodResolver(cementSchema),
  });

  const brickForm = useForm<BrickFormValues>({
    resolver: zodResolver(brickSchema),
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                   <FormField
                      control={brickForm.control}
                      name="brickType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brick/Block Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="red_brick">Red Brick</SelectItem>
                              <SelectItem value="alo_block">ALO/AAC Block</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
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
