'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/context/i18n-context';
import loadingTexts from '@/data/loading-texts.json';
import { cn } from '@/lib/utils';
import { useProposal } from '@/context/proposal-context';
import { enrichProposal } from '@/app/actions';
import type { Proposal } from '@/lib/products';

export function LoadingAnimation({ formData }: { formData: FormData }) {
  const { t } = useI18n();
  const { setProposal, handleStreamingError } = useProposal();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [streamedContent, setStreamedContent] = useState('');

  useEffect(() => {
    setCurrentTextIndex(Math.floor(Math.random() * loadingTexts.length));

    const textInterval = setInterval(() => {
      setCurrentTextIndex(prevIndex => (prevIndex + 1) % loadingTexts.length);
    }, 3000);

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
            let accumulatedChunks = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedChunks += chunk;
                
                const sentinel = '__PROPOSAL_SENTINEL__';
                const sentinelIndex = accumulatedChunks.indexOf(sentinel);

                if (sentinelIndex !== -1) {
                    const thinkingProcess = accumulatedChunks.substring(0, sentinelIndex);
                    const jsonPayload = accumulatedChunks.substring(sentinelIndex + sentinel.length);
                    
                    setStreamedContent(thinkingProcess);

                    try {
                        const parsedResult = JSON.parse(jsonPayload);
                        const { proposal, error } = await enrichProposal({
                            selectedItems: parsedResult.selectedItems,
                            analysisReport: parsedResult.analysisReport,
                        });

                        if (error) {
                          throw new Error(`Enrichment failed: ${error}`);
                        }
                        if (proposal) {
                          setProposal(proposal);
                        } else {
                          throw new Error("Enrichment did not return a proposal.");
                        }

                    } catch (e) {
                        console.error('Failed to parse or enrich final proposal JSON', e, jsonPayload);
                        throw new Error('Could not process the final proposal data from the stream.');
                    }
                    // Stop reading the stream after finding the sentinel and processing it
                    return; 
                } else {
                   setStreamedContent(accumulatedChunks);
                }
            }
        } catch (err) {
            handleStreamingError(err);
        }
    };
    
    streamResponse();

    return () => {
      clearInterval(textInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

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
        
        <div className="text-left bg-muted/30 p-4 rounded-lg min-h-[150px] whitespace-pre-wrap font-mono text-sm">
            {streamedContent || "AI is warming up..."}
        </div>
      </div>
    </div>
  );
}
