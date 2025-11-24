'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';

export default function Home() {
  const { t } = useI18n();
  return (
    <div className="container flex flex-col items-center justify-center text-center pt-24 md:pt-32">
      <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight max-w-4xl">
        {t('home.title')}
      </h1>
      <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
        {t('home.subtitle')}
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild size="lg">
          <Link href="/plan">
            {t('home.ctaButton')}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
