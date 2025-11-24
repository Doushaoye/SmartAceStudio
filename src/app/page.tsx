'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ContactSection } from '@/components/contact-section';

const showcaseImages = [
  '/showimage/1.jpg',
  '/showimage/2.jpg',
  '/showimage/3.jpg',
  '/showimage/4.jpg',
  '/showimage/5.jpg',
];

export default function Home() {
  const { t } = useI18n();
  return (
    <>
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
      <div className="py-16 md:py-24">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {showcaseImages.map((src, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                       <Image
                          src={src}
                          alt={`Smart home showcase ${index + 1}`}
                          width={600}
                          height={400}
                          className="object-cover w-full h-full"
                        />
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
       <ContactSection />
    </>
  );
}
