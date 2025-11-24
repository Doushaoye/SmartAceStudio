import Image from 'next/image';

const logos = [
  'ikea', 'xiaomi', 'philips', 'google', 'amazon', 'apple',
  'sonos', 'aqara', 'lifx', 'nanoleaf', 'wyze', 'ring',
  'ikea', 'xiaomi', 'philips', 'google', 'amazon', 'apple',
  'sonos', 'aqara', 'lifx', 'nanoleaf', 'wyze', 'ring',
];

export function BrandLogos() {
  return (
    <section className="py-12 md:py-20">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl font-headline font-semibold">合作品牌</h2>
        <p className="text-center text-muted-foreground mt-2 mb-8">我们与行业领先的品牌合作，为您提供最优质的智能家居产品。</p>
        <div className="relative h-96 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          <div className="animate-scroll absolute inset-x-0 top-0 grid grid-cols-2 md:grid-cols-4 gap-4">
            {logos.map((logo, index) => (
              <div key={index} className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center p-4">
                <Image
                  src={`https://picsum.photos/seed/${logo}${index}/200/100`}
                  alt={`${logo} logo`}
                  width={150}
                  height={75}
                  className="object-contain"
                  data-ai-hint="company logo"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
