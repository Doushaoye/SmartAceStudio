'use client';

import { Phone } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '@/context/i18n-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ContactSection() {
    const { t } = useI18n();

    return (
        <section className="w-full py-12 md:py-20 bg-muted/40">
            <div className="container px-4 md:px-6">
                <Card>
                    <CardHeader className="items-center">
                        <CardTitle className="font-headline text-3xl">{t('home.contact')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-8 items-center text-center">
                        <div className="space-y-2 flex flex-col items-center">
                            <h3 className="font-semibold">企业微信 (WeCom)</h3>
                            <Image 
                                src="https://picsum.photos/seed/wechat/128/128"
                                alt="WeCom QR Code"
                                width={128}
                                height={128}
                                className="rounded-md"
                            />
                        </div>
                        <div className="space-y-2 flex flex-col items-center">
                            <h3 className="font-semibold">抖音 (Douyin)</h3>
                             <Image 
                                src="https://picsum.photos/seed/douyin/128/128"
                                alt="Douyin QR Code"
                                width={128}
                                height={128}
                                className="rounded-md"
                            />
                        </div>
                        <div className="space-y-2 flex flex-col items-center justify-center">
                             <h3 className="font-semibold">联系电话 (Phone)</h3>
                             <div className="flex items-center gap-2 text-lg font-medium">
                                <Phone className="w-5 h-5" />
                                <span>+86-18595752875</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
