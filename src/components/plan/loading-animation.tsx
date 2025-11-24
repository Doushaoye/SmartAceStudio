'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/context/i18n-context';
import loadingTexts from '@/data/loading-texts.json';
import { cn } from '@/lib/utils';
import { useProposal } from '@/context/proposal-context';

export function LoadingAnimation({ formData }: { formData: FormData }) {
  const { t } = useI18n();
  const { setProposal, setIsLoading, setError, handleStreamingError } = useProposal();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [streamedContent, setStreamedContent] = useState('');

  useEffect(() => {
    // Randomly select an initial text
    setCurrentTextIndex(Math.floor(Math.random() * loadingTexts.length));

    const textInterval = setInterval(() => {
      setCurrentTextIndex(prevIndex => (prevIndex + 1) % loadingTexts.length);
    }, 3000); // Change text every 3 seconds

    const streamResponse = async () => {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new Error(`Request failed with status ${response.status}: ${errorText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalResult: any = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // Look for the sentinel value to find the final JSON
                const parts = chunk.split('__PROPOSAL_SENTINEL__=');
                if (parts.length > 1) {
                    try {
                        finalResult = JSON.parse(parts[1]);
                    } catch (e) {
                        console.error('Failed to parse final proposal JSON', e);
                    }
                    setStreamedContent(current => current + parts[0]);
                } else {
                    setStreamedContent(current => current + chunk);
                }
            }

            if (finalResult) {
                setProposal(finalResult);
            } else {
                 throw new Error("Streaming completed but no final proposal data was received.");
            }

        } catch (err) {
            handleStreamingError(err);
        }
    };
    
    streamResponse();

    return () => {
      clearInterval(textInterval);
    };
  }, [formData, setProposal, setIsLoading, setError, handleStreamingError]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-10 w-full max-w-2xl mx-auto">
      <h2 className="text-3xl font-semibold font-headline">{t('planningForm.loadingTitle')}</h2>
      
      {/* Voice Assistant Style Animation */}
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
        
        {/* Streamed content display */}
        <div className="text-left bg-muted/30 p-4 rounded-lg min-h-[150px] whitespace-pre-wrap font-mono text-sm">
            {streamedContent}
        </div>
      </div>
    </div>
  );
}
