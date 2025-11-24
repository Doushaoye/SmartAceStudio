'use client';

import type { Proposal, EnrichedItem } from '@/lib/products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MarkdownRenderer } from './markdown-renderer';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useI18n } from '@/context/i18n-context';
import { Button } from '@/components/ui/button';
import { LockKeyhole } from 'lucide-react';
import { UnlockForm } from './unlock-form';

interface ResultDashboardProps {
  proposal: Proposal;
}

export function ResultDashboard({ proposal }: ResultDashboardProps) {
  const { t, language } = useI18n();
  const { analysisReport, enrichedItems } = proposal;
  const [isUnlocked, setIsUnlocked] = useState(false);

  const totalCost = useMemo(() => {
    return enrichedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [enrichedItems]);

  const groupedByRoom = useMemo(() => {
    return enrichedItems.reduce<Record<string, EnrichedItem[]>>((acc, item) => {
      const room = item.room || 'General';
      if (!acc[room]) {
        acc[room] = [];
      }
      acc[room].push(item);
      return acc;
    }, {});
  }, [enrichedItems]);

  const currencyFormatter = useMemo(() => {
    const currency = language === 'zh' ? 'CNY' : 'USD';
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
  }, [language]);
  
  const handleUnlock = (data: { name: string; phone: string }) => {
    console.log("Customer Info:", data);
    // TODO: Send customer info to Feishu via webhook
    // try {
    //   await fetch('YOUR_FEISHU_WEBHOOK_URL', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       msg_type: 'text',
    //       content: {
    //         text: `新客户线索\n姓名: ${data.name}\n电话: ${data.phone}`
    //       }
    //     })
    //   });
    // } catch (error) {
    //   console.error("Failed to send to Feishu:", error);
    // }
    setIsUnlocked(true);
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{t('result.title')}</CardTitle>
                <CardDescription>{t('result.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
                {Object.entries(groupedByRoom).map(([room, items]) => {
                  const isLivingRoom = room === '客厅' || room.toLowerCase().includes('living');
                  return (
                    <div key={room} className="mb-8 last:mb-0">
                      <h3 className="text-xl font-headline font-semibold mb-4">{room}</h3>
                      <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[80px] hidden md:table-cell">{t('result.table.image')}</TableHead>
                                <TableHead>{t('result.table.product')}</TableHead>
                                <TableHead>{t('result.table.quantity')}</TableHead>
                                <TableHead className="text-right">{t('result.table.unitPrice')}</TableHead>
                                <TableHead className="text-right">{t('result.table.subtotal')}</TableHead>
                                </TableRow>
                            </TableHeader>
                             {isUnlocked || isLivingRoom ? (
                                <TableBody>
                                    {items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="hidden md:table-cell">
                                            <Image
                                                src={item.imageUrl || 'https://picsum.photos/seed/default/400/400'}
                                                alt={item.name}
                                                width={60}
                                                height={60}
                                                className="rounded-md object-cover"
                                                data-ai-hint={item.imageHint}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-sm text-muted-foreground">{item.brand}</div>
                                        </TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-right">{currencyFormatter.format(item.price)}</TableCell>
                                        <TableCell className="text-right font-medium">{currencyFormatter.format(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            ) : (
                                <TableBody>
                                  <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                      {t('result.unlockPrompt')}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                             )}
                        </Table>
                    </div>
                  </div>
                )})}
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-8 relative">
        <div className={`transition-all duration-300 ${isUnlocked ? '' : 'blur-lg pointer-events-none'}`}>
          <div className="space-y-8">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="font-headline">{t('result.totalBudget')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{currencyFormatter.format(totalCost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">{t('result.aiAnalysis')}</CardTitle>
              </CardHeader>
              <CardContent className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                <MarkdownRenderer content={analysisReport} />
              </CardContent>
            </Card>
          </div>
        </div>

        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <UnlockForm onUnlock={handleUnlock}>
              <Button size="lg" className="shadow-2xl scale-110">
                <LockKeyhole className="mr-2 h-5 w-5" />
                {t('result.unlockButton')}
              </Button>
            </UnlockForm>
          </div>
        )}
      </div>
    </div>
  );
}
