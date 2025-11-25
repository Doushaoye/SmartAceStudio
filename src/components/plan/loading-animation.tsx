'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/context/i18n-context';
import loadingTexts from '@/data/loading-texts.json';
import { cn } from '@/lib/utils';
import { useProposal } from '@/context/proposal-context';

export function LoadingAnimation() {
  const { t } = useI18n();
  const { error } = useProposal();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentTextIndex(prevIndex => (prevIndex + 1) % loadingTexts.length);
    }, 3000);

    return () => {
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-10 w-full max-w-2xl mx-auto">
      <h2 className="text-3xl font-semibold font-headline">{t('planningForm.loadingTitle')}</h2>
      
      <div className="relative w-48 h-48 flex items-center justify-center">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full bg-primary/50 animate-pulse-blob",
            )}
            style={{
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full space-y-3 min-h-[100px]">
        <p className="text-muted-foreground text-lg">
            {loadingTexts[currentTextIndex]}
        </p>
        
        {error && (
            <div className="text-left bg-destructive/10 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm text-destructive">
                <p className="font-bold">An error occurred:</p>
                {error}
            </div>
        )}
      </div>
    </div>
  );
}
