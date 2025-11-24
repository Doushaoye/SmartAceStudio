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
import { DollarSign, Zap, Gem, ArrowRight, FileUp, User, Heart, Baby, Accessibility, Cat } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { LoadingAnimation } from './loading-animation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const householdProfileOptions = [
  { label: "独居青年", value: "single", icon: User },
  { label: "二人世界", value: "couple", icon: Heart },
  { label: "有娃家庭", value: "kids", icon: Baby },
  { label: "家有长辈", value: "elderly", icon: Accessibility },
  { label: "萌宠当家", value: "pets", icon: Cat },
];

const focusAreaOptions = [
  { label: "全屋安防", value: "security" },
  { label: "影音娱乐", value: "entertainment" },
  { label: "灯光氛围", value: "lighting" },
  { label: "懒人自动", value: "automation" },
  { label: "节能环保", value: "energy" },
];


const formSchema = z.object({
  area: z.coerce.number().min(1, 'Area must be at least 1 sq ft.'),
  layout: z.enum(['2r1l1b', '3r2l1b', '3r2l2b', '4r2l2b', '4r2l3b'], { required_error: 'Please select a layout.'}),
  budgetLevel: z.enum(['economy', 'premium', 'luxury'], { required_error: 'Please select a budget tier.' }),
  householdProfile: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
  customNeeds: z.string().optional(),
  floorPlan: z.instanceof(File).optional(),
});

export function PlanningForm() {
  const { isLoading, generateProposal } = useProposal();
  const { t, language } = useI18n();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      area: 110,
      layout: '3r2l2b',
      householdProfile: [],
      focusAreas: [],
      customNeeds: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('area', String(values.area));
    formData.append('layout', values.layout);
    formData.append('budgetLevel', values.budgetLevel);
    formData.append('customNeeds', values.customNeeds || '');

    (values.householdProfile || []).forEach(value => {
        formData.append('householdProfile[]', value);
    });
    (values.focusAreas || []).forEach(value => {
        formData.append('focusAreas[]', value);
    });

    if (values.floorPlan) {
      formData.append('floorPlan', values.floorPlan);
    }
    generateProposal(formData);
  };
  
  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{t('planningForm.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-headline">{t('planningForm.propertyInfo.title')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('planningForm.propertyInfo.areaLabel')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('planningForm.propertyInfo.areaPlaceholder')} {...field} />
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
                      <FormLabel>{t('planningForm.propertyInfo.layoutLabel')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('planningForm.propertyInfo.layoutPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2r1l1b">{t('planningForm.propertyInfo.layoutOptions.2r1l1b')}</SelectItem>
                          <SelectItem value="3r2l1b">{t('planningForm.propertyInfo.layoutOptions.3r2l1b')}</SelectItem>
                          <SelectItem value="3r2l2b">{t('planningForm.propertyInfo.layoutOptions.3r2l2b')}</SelectItem>
                          <SelectItem value="4r2l2b">{t('planningForm.propertyInfo.layoutOptions.4r2l2b')}</SelectItem>
                          <SelectItem value="4r2l3b">{t('planningForm.propertyInfo.layoutOptions.4r2l3b')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-lg font-headline">{t('planningForm.budget.title')}</h3>
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
                          {t('planningForm.budget.economy.label')}
                          <span className="text-xs text-muted-foreground mt-1">{t('planningForm.budget.economy.description')}</span>
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
                          {t('planningForm.budget.premium.label')}
                           <span className="text-xs text-muted-foreground mt-1">{t('planningForm.budget.premium.description')}</span>
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
                          {t('planningForm.budget.luxury.label')}
                           <span className="text-xs text-muted-foreground mt-1">{t('planningForm.budget.luxury.description')}</span>
                        </Label>
                      </FormItem>
                    </RadioGroup>
                    <FormMessage className="text-center pt-2" />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-6">
                <h3 className="font-semibold text-lg font-headline">{t('planningForm.customization.title')}</h3>
                
                <FormField
                  control={form.control}
                  name="householdProfile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>家庭成员结构 (多选)</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {householdProfileOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={field.value?.includes(option.value) ? 'default' : 'outline'}
                            onClick={() => {
                              const newValue = field.value?.includes(option.value)
                                ? field.value.filter((v) => v !== option.value)
                                : [...(field.value || []), option.value];
                              field.onChange(newValue);
                            }}
                          >
                            <option.icon className="mr-2 h-4 w-4" />
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="focusAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>您最关注的智能体验 (多选)</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {focusAreaOptions.map((option) => (
                           <Button
                            key={option.value}
                            type="button"
                            variant={field.value?.includes(option.value) ? 'default' : 'outline'}
                             onClick={() => {
                              const newValue = field.value?.includes(option.value)
                                ? field.value.filter((v) => v !== option.value)
                                : [...(field.value || []), option.value];
                              field.onChange(newValue);
                            }}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <FormField
                      control={form.control}
                      name="floorPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('planningForm.customization.floorPlanLabel')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                                <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="file" accept="image/*" className="pl-9" 
                                   onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : undefined)}
                                />
                            </div>
                          </FormControl>
                          <FormDescription>{t('planningForm.customization.floorPlanDescription')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="customNeeds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('planningForm.customization.customNeedsLabel')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="还有其他特殊需求吗？例如：'希望主卧有一个阅读模式'..."
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
                {t('planningForm.submitButton')}
                <ArrowRight />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
