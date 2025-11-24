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
import { DollarSign, Zap, Gem, ArrowRight, FileUp, User, Heart, Baby, Accessibility, Cat, Download, Upload, FileText } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { LoadingAnimation } from './loading-animation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';


const householdProfileOptions = [
  { label: "独居青年", value: "single", icon: User },
  { label: "二人世界", value: "couple", icon: Heart },
  { label: "有娃家庭", value: "kids", icon: Baby },
  { label: "家有长辈", value: "elderly", icon: Accessibility },
  { label: "萌宠当家", value: "pets", icon: Cat },
];

const mutuallyExclusiveProfiles = ["single", "couple", "kids"];

const focusAreaOptions = [
  { label: "全屋安防", value: "security" },
  { label: "影音娱乐", value: "entertainment" },
  { label: "灯光氛围", value: "lighting" },
  { label: "懒人自动", value: "automation" },
  { label: "节能环保", value: "energy" },
];

const lightingStyleOptions = [
    { label: "意式极简", value: "italian-minimalist" },
    { label: "现代简约", value: "modern-simple" },
    { label: "法式", value: "french" },
    { label: "美式", value: "american" },
    { label: "海派", value: "shanghai-style" },
    { label: "奶油风", value: "creamy-style" },
];

const ecosystemOptions = [
    { label: "米家", value: "米家" },
    { label: "Aqara", value: "Aqara" },
    { label: "Yeelight Pro", value: "YeelightPro" },
    { label: "HomeKit", value: "HomeKit" },
];

const formSchema = z.object({
  area: z.coerce.number().min(1, 'Area must be at least 1 sq ft.'),
  layout: z.enum(['2r1l1b', '3r2l1b', '3r2l2b', '4r2l2b', '4r2l3b'], { required_error: 'Please select a layout.'}),
  budgetLevel: z.enum(['economy', 'premium', 'luxury'], { required_error: 'Please select a budget tier.' }),
  householdProfile: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
  lightingStyle: z.string().optional(),
  ecosystem: z.string().optional(),
  customNeeds: z.string().optional(),
  floorPlan: z.instanceof(File).optional(),
  customProductsCsv: z.string().optional(),
});

const csvTemplateHeader = "产品名称,品牌,品类,价格,生态平台(用;分隔),产品描述";
const csvTemplateContent = `${csvTemplateHeader}\n自定义产品A,自定义品牌,网关,199,"米家;HomeKit",这是一个用户自定义的产品示例，用于家庭的中央控制。\n自定义灯泡B,飞利浦,灯光,88,Hue,高品质彩色智能灯泡，可调节亮度和颜色。`;


export function PlanningForm() {
  const { isLoading, generateProposal } = useProposal();
  const { t } = useI18n();
  const { toast } = useToast();
  const [customProductsFile, setCustomProductsFile] = useState<File | null>(null);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      area: 110,
      layout: '3r2l2b',
      householdProfile: [],
      focusAreas: [],
      lightingStyle: 'modern-simple',
      ecosystem: '米家',
      customNeeds: '',
      customProductsCsv: '',
    },
  });

  const handleDownloadTemplate = () => {
    const blob = new Blob([`\uFEFF${csvTemplateContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-products-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
           const parseResult = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
          });

          if (parseResult.errors.length > 0) {
             throw new Error(`CSV文件表头或格式错误: ${parseResult.errors[0].message}`);
          }
          
          const requiredHeaders = csvTemplateHeader.split(',');
          if (!parseResult.meta.fields || !requiredHeaders.every(h => parseResult.meta.fields?.includes(h))) {
             throw new Error(`CSV文件表头不匹配。需要包含: ${requiredHeaders.join(', ')}`);
          }
          
          form.setValue('customProductsCsv', content);
          setCustomProductsFile(file);
          toast({
            title: "上传成功",
            description: `产品库文件 "${file.name}" 已成功上传并验证。`,
          });
        } catch (error) {
          console.error("CSV validation error:", error);
          form.setValue('customProductsCsv', '');
          setCustomProductsFile(null);
          event.target.value = ''; // Reset file input
          
          let errorMessage = "上传的CSV文件格式不符合要求，请检查后重试。";
          if (error instanceof Error) {
             errorMessage = error.message;
          }

          toast({
            variant: "destructive",
            title: "文件格式错误",
            description: errorMessage,
          });
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('area', String(values.area));
    formData.append('layout', values.layout);
    formData.append('budgetLevel', values.budgetLevel);
    formData.append('customNeeds', values.customNeeds || '');
    formData.append('lightingStyle', values.lightingStyle || '');
    formData.append('ecosystem', values.ecosystem || '');


    (values.householdProfile || []).forEach(value => {
        formData.append('householdProfile[]', value);
    });
    (values.focusAreas || []).forEach(value => {
        formData.append('focusAreas[]', value);
    });

    if (values.floorPlan) {
      formData.append('floorPlan', values.floorPlan);
    }
    
    if (values.customProductsCsv) {
      formData.append('productsCsv', values.customProductsCsv);
    }

    generateProposal(formData);
    setSubmittedData(formData);
  };
  
  if (isLoading && submittedData) {
    return <LoadingAnimation formData={submittedData} />;
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
                              const isExclusive = mutuallyExclusiveProfiles.includes(option.value);
                              const currentValue = field.value || [];
                              let newValue = [...currentValue];

                              if (isExclusive) {
                                if (newValue.includes(option.value)) {
                                  newValue = newValue.filter((v) => v !== option.value);
                                } else {
                                  newValue = newValue.filter((v) => !mutuallyExclusiveProfiles.includes(v));
                                  newValue.push(option.value);
                                }
                              } else {
                                if (newValue.includes(option.value)) {
                                  newValue = newValue.filter((v) => v !== option.value);
                                } else {
                                  newValue.push(option.value);
                                }
                              }
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
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="lightingStyle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>照明设计风格</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="请选择一种照明风格" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {lightingStyleOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={form.control}
                      name="ecosystem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>优先智能生态</FormLabel>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-wrap gap-x-4 gap-y-2 pt-2"
                          >
                            {ecosystemOptions.map(option => (
                              <FormItem key={option.value} className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem 
                                    value={option.value} 
                                    id={`eco-${option.value}`} 
                                    disabled={option.value !== '米家'}
                                  />
                                </FormControl>
                                <Label 
                                  htmlFor={`eco-${option.value}`}
                                  className={cn(option.value !== '米家' && "text-muted-foreground/50 cursor-not-allowed")}
                                >
                                  {option.label}
                                </Label>
                              </FormItem>
                            ))}
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>
            
            <div className="space-y-6">
                <h3 className="font-semibold text-lg font-headline">自定义产品库 (可选)</h3>
                 <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
                    <FormDescription>
                        您可以上传自己的产品库CSV表格文件，AI将优先使用您提供的产品进行方案设计。
                    </FormDescription>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" />
                            下载模板
                        </Button>
                        <div className="relative w-full sm:w-auto">
                            <Button type="button" variant="outline" asChild className="w-full">
                                <Label htmlFor="custom-products-upload" className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-f`ull" />
                                    上传产品库
                                </Label>
                            </Button>
                            <Input id="custom-products-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileUpload} />
                        </div>
                    </div>
                    {customProductsFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-background rounded-md border">
                            <FileText className="h-5 w-5 text-primary" />
                            <span>已上传: <span className="font-medium text-foreground">{customProductsFile.name}</span></span>
                        </div>
                    )}
                 </div>
            </div>


            <div className="grid md:grid-cols-2 gap-6">
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
