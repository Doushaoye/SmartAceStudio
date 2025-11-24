'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const brandData = [
  {
    name: '智装侠',
    description: '专业的智能家居服务团队，致力于让所有人体验到智能带来的美好，智装，就找智装侠。',
    logoUrl: 'https://free.picui.cn/free/2025/11/25/692495e34d1bf.png',
    imageUrl: 'https://free.picui.cn/free/2025/11/25/6924968939d33.png',
  },
  {
    name: 'Xiaomi',
    description: '小米集团是一家中国的跨国电子公司，专注于智能手机、移动应用、笔记本电脑、家用电器、箱包、鞋、消费电子产品等。',
    logoUrl: 'https://picsum.photos/seed/xiaomi-logo/200/100',
    imageUrl: 'https://picsum.photos/seed/xiaomi-image/600/400',
  },
  {
    name: 'Philips',
    description: '荷兰皇家飞利浦公司是一家领先的健康科技公司，致力于在从健康的生活方式及疾病的预防、到诊断、治疗和家庭护理的整个健康关护全程，提高人们的健康水平。',
    logoUrl: 'https://picsum.photos/seed/philips-logo/200/100',
    imageUrl: 'https://picsum.photos/seed/philips-image/600/400',
  },
  {
    name: 'Google',
    description: '谷歌公司（Google Inc.）是源自美国的跨国科技公司，为Alphabet Inc.的子公司，业务范围涵盖互联网广告、互联网搜索、云计算、软件和硬件等领域。',
    logoUrl: 'https://picsum.photos/seed/google-logo/200/100',
    imageUrl: 'https://picsum.photos/seed/google-image/600/400',
  },
   {
    name: 'Amazon',
    description: '亚马逊公司是美国最大的一家网络电子商务公司，位于华盛顿州的西雅图。是网络上最早开始经营电子商务的公司之一。',
    logoUrl: 'https://picsum.photos/seed/amazon-logo/200/100',
    imageUrl: 'https://picsum.photos/seed/amazon-image/600/400',
  },
  {
    name: 'Apple',
    description: '苹果公司是美国一家高科技公司。由史蒂夫·乔布斯、斯蒂夫·沃兹尼亚克和罗·韦恩等人于1976年4月1日创立。',
    logoUrl: 'https://picsum.photos/seed/apple-logo/200/100',
    imageUrl: 'https://picsum.photos/seed/apple-image/600/400',
  },
   {
    name: 'Aqara',
    description: '绿米联创是领先的智能家居和物联网解决方案提供商，以其Aqara品牌而闻名，提供广泛的智能家居产品。',
    logoUrl: 'https://picsum.photos/seed/aqara-logo/200/100',
    imageUrl: 'https://picsum.photos/seed/aqara-image/600/400',
  },
];

// Duplicate brands for seamless scrolling effect
const logos = [...brandData.slice(1), ...brandData.slice(1), ...brandData.slice(1)];

export function BrandLogos() {
  const [selectedBrand, setSelectedBrand] = useState(brandData[0]);

  return (
    <section className="py-12 md:py-20">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl font-headline font-semibold">合作品牌</h2>
        <p className="text-center text-muted-foreground mt-2 mb-8">我们与行业领先的品牌合作，为您提供最优质的智能家居产品。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Details View */}
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                  <div className="aspect-video relative mb-4">
                     <Image
                        src={selectedBrand.imageUrl}
                        alt={`${selectedBrand.name} showcase`}
                        fill
                        className="object-cover rounded-t-lg"
                        data-ai-hint="brand product"
                      />
                  </div>
                <CardTitle className="font-headline text-2xl">{selectedBrand.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{selectedBrand.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Scrolling Logos */}
          <div className="md:col-span-2 group relative h-96 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
            <div className="animate-scroll group-hover:[animation-play-state:paused] absolute inset-x-0 top-0 grid grid-cols-2 md:grid-cols-3 gap-4">
              {logos.map((brand, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedBrand(brand)}
                  className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center p-4 transition-all duration-300 hover:bg-muted"
                >
                  <Image
                    src={brand.logoUrl}
                    alt={`${brand.name} logo`}
                    width={150}
                    height={75}
                    className="object-contain"
                    data-ai-hint="company logo"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}