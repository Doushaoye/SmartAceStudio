'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Proposal } from '@/lib/products';
import { useI18n } from './i18n-context';
import { generateProposalAction } from '@/app/actions';

interface ProposalContextType {
  proposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  startProposalGeneration: (data: FormData) => void;
  setProposal: (proposal: Proposal | null) => void; // Keep for direct setting if needed
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [proposal, setProposalState] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  const startProposalGeneration = useCallback(async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setProposalState(null);
    
    const result = await generateProposalAction(data);

    if (result.error) {
      setError(result.error);
      toast({
        variant: 'destructive',
        title: t('errors.generateProposalTitle'),
        description: result.error,
      });
      setIsLoading(false);
    } else if (result.proposal) {
      setProposalState(result.proposal);
      setIsLoading(false);
      router.push('/result');
    } else {
        const fallbackError = "Generation finished without a proposal or an error.";
        setError(fallbackError);
        toast({
            variant: 'destructive',
            title: t('errors.generateProposalTitle'),
            description: fallbackError,
        });
        setIsLoading(false);
    }
  }, [router, t, toast]);

  // This function can be used if we need to set the proposal from somewhere else
  const setProposal = useCallback((newProposal: Proposal | null) => {
    setProposalState(newProposal);
    if (newProposal) {
        setIsLoading(false);
        setError(null);
        router.push('/result');
    }
  }, [router]);
  
  return (
    <ProposalContext.Provider value={{ proposal, isLoading, error, startProposalGeneration, setProposal, setIsLoading, setError }}>
      {children}
    </ProposalContext.Provider>
  );
}

export function useProposal() {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposal must be used within a ProposalProvider');
  }
  return context;
}
