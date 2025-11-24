'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useProposal } from '@/context/proposal-context';
import { DollarSign, Zap, Gem, ArrowRight, Loader2, FileUp } from 'lucide-react';

const formSchema = z.object({
  area: z.coerce.number().min(10, 'Area must be at least 10 sq ft.'),
  layout: z.string().min(1, 'Please select a layout.'),
  budgetLevel: z.enum(['economy', 'premium', 'luxury'], { required_error: 'Please select a budget tier.' }),
  customNeeds: z.string().optional(),
  floorPlan: z.instanceof(File).optional(),
});

export function PlanningForm() {
  const { isLoading, generateProposal } = useProposal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      area: 500,
      layout: '1B1B',
      customNeeds: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('area', String(values.area));
    formData.append('layout', values.layout);
    formData.append('budgetLevel', values.budgetLevel);
    formData.append('customNeeds', values.customNeeds || '');
    if (values.floorPlan) {
      formData.append('floorPlan', values.floorPlan);
    }
    generateProposal(formData);
  };
  
  const floorPlanRef = form.register('floorPlan');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold font-headline">AI is analyzing your request...</h2>
        <p className="text-muted-foreground max-w-md">
          This may take a moment. We're crafting a personalized smart home plan just for you, analyzing the floor plan and your custom needs.
        </p>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Create Your Smart Home Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-headline">1. Property Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Area (sq ft)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="layout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Layout</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property layout" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Studio">Studio</SelectItem>
                          <SelectItem value="1B1B">1 Bed 1 Bath</SelectItem>
                          <SelectItem value="2B1B">2 Bed 1 Bath</SelectItem>
                          <SelectItem value="3B2B">3 Bed 2 Bath</SelectItem>
                          <SelectItem value="Villa">Villa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-headline">2. Budget Tier</h3>
              <FormField
                control={form.control}
                name="budgetLevel"
                render={({ field }) => (
                  <FormItem>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="economy" id="economy" className="peer sr-only" />
                        </FormControl>
                        <Label
                          htmlFor="economy"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <DollarSign className="mb-3 h-6 w-6" />
                          Economy
                          <span className="text-xs text-muted-foreground mt-1">Practical & Cost-Effective</span>
                        </Label>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="premium" id="premium" className="peer sr-only" />
                        </FormControl>
                        <Label
                          htmlFor="premium"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Zap className="mb-3 h-6 w-6" />
                          Premium
                           <span className="text-xs text-muted-foreground mt-1">Comfort & Performance</span>
                        </Label>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="luxury" id="luxury" className="peer sr-only" />
                        </FormControl>
                        <Label
                          htmlFor="luxury"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Gem className="mb-3 h-6 w-6" />
                          Luxury
                           <span className="text-xs text-muted-foreground mt-1">High-End & Automated</span>
                        </Label>
                      </FormItem>
                    </RadioGroup>
                    <FormMessage className="text-center pt-2" />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-6">
                <h3 className="font-semibold text-lg font-headline">3. Customization</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="floorPlan"
                      render={({ field: { onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Floor Plan (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                                <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="file" accept="image/*" className="pl-9" {...floorPlanRef} onChange={(e) => onChange(e.target.files?.[0])} />
                            </div>
                          </FormControl>
                          <FormDescription>Upload an image of your floor plan for better recommendations.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="customNeeds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Needs</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., 'I have elderly parents, need automated night lights.' or 'Primarily focused on home cinema experience.'"
                              className="resize-none"
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isLoading}>
                Generate Proposal
                <ArrowRight />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
