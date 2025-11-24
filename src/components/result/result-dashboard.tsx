'use client';

import type { Proposal, EnrichedItem } from '@/lib/products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { MarkdownRenderer } from './markdown-renderer';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import Image from 'next/image';
import { findImage } from '@/lib/placeholder-images';
import { useI18n } from '@/context/i18n-context';

interface ResultDashboardProps {
  proposal: Proposal;
}

export function ResultDashboard({ proposal }: ResultDashboardProps) {
  const { t, language } = useI18n();
  const { analysisReport, enrichedItems } = proposal;

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


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{t('result.title')}</CardTitle>
                <CardDescription>{t('result.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
                {Object.entries(groupedByRoom).map(([room, items]) => (
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
                            <TableBody>
                                {items.map(item => {
                                const placeholder = findImage(item.image_id);
                                return (
                                <TableRow key={item.id}>
                                    <TableCell className="hidden md:table-cell">
                                        <Image
                                            src={placeholder.imageUrl}
                                            alt={item.name}
                                            width={60}
                                            height={60}
                                            className="rounded-md object-cover"
                                            data-ai-hint={placeholder.imageHint}
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
                                )})}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                ))}
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-8">
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
  );
}
