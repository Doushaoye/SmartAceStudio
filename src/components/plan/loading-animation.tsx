'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogos } from '../brand-logos';
import { useI18n } from '@/context/i18n-context';

const progressSteps = {
    zh: [
        "正在分析您的户型、预算和个性化需求...",
        "正在连接AI大脑，根据您的偏好筛选兼容的智能生态产品...",
        "正在进行多轮产品组合与预算权衡，寻找最优搭配...",
        "正在为您撰写专属的《智能家居顾问分析报告》...",
        "方案即将生成，请准备好迎接惊喜！"
    ],
    en: [
        "Analyzing your floor plan, budget, and custom needs...",
        "Connecting to the AI brain, filtering for compatible smart ecosystem products based on your preferences...",
        "Running multiple rounds of product combinations and budget trade-offs to find the optimal mix...",
        "Writing your exclusive 'Smart Home Consultant Analysis Report'...",
        "Proposal is about to be generated, get ready for the surprise!"
    ],
    ja: [
        "間取り、予算、個別のニーズを分析しています...",
        "AIブレインに接続し、お好みに合わせて互換性のあるスマートエコシステム製品をフィルタリングしています...",
        "製品の組み合わせと予算のトレードオフを複数回実行し、最適な組み合わせを見つけています...",
        "あなただけの「スマートホームコンサルタント分析レポート」を作成しています...",
        "提案がまもなく生成されます。驚きの準備をしてください！"
    ],
    ko: [
        "평면도, 예산 및 사용자 정의 요구 사항을 분석하는 중...",
        "AI 두뇌에 연결하여 선호도에 따라 호환되는 스마트 생태계 제품을 필터링하는 중...",
        "최적의 조합을 찾기 위해 여러 차례의 제품 조합 및 예산 절충을 실행하는 중...",
        "귀하의 독점적인 '스마트 홈 컨설턴트 분석 보고서'를 작성하는 중...",
        "제안이 곧 생성될 예정입니다. 놀라움을 준비하세요!"
    ]
};


export function LoadingAnimation() {
  const [step, setStep] = useState(0);
  const { t, language } = useI18n();
  
  const texts = progressSteps[language as keyof typeof progressSteps] || progressSteps.zh;

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prevStep) => {
        if (prevStep < texts.length - 1) {
          return prevStep + 1;
        }
        return prevStep; // Stay on the last step
      });
    }, 4000); // Change text every 4 seconds

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="w-24 h-24 mb-8 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full"
      />
      <div className="h-16 w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-semibold text-foreground max-w-md mx-auto"
          >
            {texts[step]}
          </motion.p>
        </AnimatePresence>
      </div>
      
      <div className="w-full max-w-md mx-auto mt-4">
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${((step + 1) / texts.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
        </div>
      </div>

      <div className="mt-16">
        <p className="text-sm text-muted-foreground mb-4">{t('loading.poweredBy')}</p>
        <BrandLogos />
      </div>
    </div>
  );
}
