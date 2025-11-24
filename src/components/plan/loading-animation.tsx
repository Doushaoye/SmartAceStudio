'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/context/i18n-context';

const loadingSteps = [
    { key: 'loading.steps.analyzingNeeds', duration: 3000 },
    { key: 'loading.steps.evaluatingLayout', duration: 4000 },
    { key: 'loading.steps.selectingProducts', duration: 5000 },
    { key: 'loading.steps.optimizingBudget', duration: 4000 },
    { key: 'loading.steps.generatingReport', duration: 3000 },
    { key: 'loading.steps.finalizing', duration: 2000 },
];


export function LoadingAnimation() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = loadingSteps.reduce((acc, step) => acc + step.duration, 0);
    let elapsed = 0;

    const stepInterval = setInterval(() => {
        if (currentStep < loadingSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            clearInterval(stepInterval);
        }
    }, loadingSteps[currentStep].duration);

    const progressInterval = setInterval(() => {
        elapsed += 100;
        const currentProgress = Math.min(100, (elapsed / totalDuration) * 100);
        setProgress(currentProgress);

        if (currentProgress >= 100) {
            clearInterval(progressInterval);
        }
    }, 100);

    return () => {
        clearInterval(stepInterval);
        clearInterval(progressInterval);
    };
  }, [currentStep]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-6 w-full max-w-2xl mx-auto">
      <h2 className="text-3xl font-semibold font-headline">{t('planningForm.loadingTitle')}</h2>
      <div className="w-full space-y-3">
        <Progress value={progress} />
        <p className="text-muted-foreground text-lg animate-pulse">
            {t(loadingSteps[currentStep].key)}
        </p>
      </div>
      <p className="text-muted-foreground max-w-md mt-4">
        {t('planningForm.loadingDescription')}
      </p>
    </div>
  );
}
