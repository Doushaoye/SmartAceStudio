'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/i18n-context';
import loadingTexts from '@/data/loading-texts.json';
import { cn } from '@/lib/utils';
import { useProposal } from '@/context/proposal-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const PROPOSAL_SENTINEL = '__PROPOSAL_SENTINEL__';

export function LoadingAnimation({ formData }: { formData: FormData | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const { setProposal, setIsLoading, setError, error } = useProposal();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [streamedContent, setStreamedContent] = useState('');
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentTextIndex(prevIndex => (prevIndex + 1) % loadingTexts.length);
    }, 3000);

    return () => clearInterval(textInterval);
  }, []);

  const startGeneration = useCallback(async () => {
    if (!formData) return;

    setIsLoading(true);
    setError(null);
    setStreamedContent('');
    setProgressMessage('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get readable stream.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Handle progress messages
        const progressRegex = /\[PROGRESS\] (.*?)\n/g;
        let match;
        while ((match = progressRegex.exec(buffer)) !== null) {
            setProgressMessage(match[1]);
        }
        buffer = buffer.replace(progressRegex, '');

        // Handle errors from the stream
        const errorRegex = /\[ERROR\] (.*?)\n/g;
        while ((match = errorRegex.exec(buffer)) !== null) {
            throw new Error(match[1]);
        }
        buffer = buffer.replace(errorRegex, '');


        const sentinelIndex = buffer.indexOf(PROPOSAL_SENTINEL);
        if (sentinelIndex !== -1) {
          const jsonString = buffer.substring(sentinelIndex + PROPOSAL_SENTINEL.length);
          try {
            const finalProposal = JSON.parse(jsonString);
            setProposal(finalProposal);
            router.push('/result');
            return; // Exit the loop
          } catch (e) {
            // JSON might be incomplete, continue reading
          }
        }
        
        setStreamedContent(current => current + decoder.decode(value, { stream: true }).replace(/\[(PROGRESS|ERROR)\].*?\n/g, ''));
      }
    } catch (e: any) {
      console.error('Streaming failed:', e);
      const errorMessage = e.message || 'Failed to generate proposal.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('errors.generateProposalTitle'),
        description: errorMessage,
      });
      setIsLoading(false);
    }
  }, [formData, setIsLoading, setError, setProposal, router, t, toast]);

  useEffect(() => {
    startGeneration();
  }, [startGeneration]);


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

      <div className="w-full space-y-4 min-h-[150px]">
        <p className="text-muted-foreground text-lg">
            {progressMessage || loadingTexts[currentTextIndex]}
        </p>

        {streamedContent && (
            <div className="text-left bg-muted/50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm text-foreground overflow-y-auto max-h-48">
                <code>{streamedContent.replace(PROPOSAL_SENTINEL, '')}</code>
            </div>
        )}
        
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