'use client';

import { Phone } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '@/context/i18n-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';


export function ContactSection() {
    const { t } = useI18n();

    const qrCodes = [
        {
            title: "企业微信 (WeCom)",
            src: "https://free.picui.cn/free/2025/11/25/692497dd371cc.png",
            alt: "WeCom QR Code"
        },
        {
            title: "抖音 (Douyin)",
            src: "https://free.picui.cn/free/2025/11/25/692497dd7b6cd.png",
            alt: "Douyin QR Code"
        }
    ];

    return (
        <section className="w-full py-12 md:py-20 bg-muted/40">
            <div className="container px-4 md:px-6">
                <Card>
                    <CardHeader className="items-center">
                        <CardTitle className="font-headline text-3xl">{t('home.contact')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-8 items-center text-center">
                        {qrCodes.map((qr) => (
                           <div key={qr.title} className="space-y-2 flex flex-col items-center">
                                <h3 className="font-semibold">{qr.title}</h3>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="cursor-pointer">
                                            <Image 
                                                src={qr.src}
                                                alt={qr.alt}
                                                width={128}
                                                height={128}
                                                className="rounded-md"
                                            />
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="p-0 max-w-xs">
                                        <Image 
                                            src={qr.src}
                                            alt={qr.alt}
                                            width={400}
                                            height={400}
                                            className="rounded-md"
                                        />
                                    </DialogContent>
                                </Dialog>
                           </div>
                        ))}
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
