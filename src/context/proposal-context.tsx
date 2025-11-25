'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Proposal } from '@/lib/products';
import { useI18n } from './i18n-context';

interface ProposalContextType {
  proposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  startProposalGeneration: (data: FormData) => void;
  setProposal: (proposal: Proposal | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  handleStreamingError: (err: any) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [proposal, setProposalState] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();

  const startProposalGeneration = useCallback((data: FormData) => {
    setIsLoading(true);
    setError(null);
    setProposalState(null);
    // The actual generation is handled by the LoadingAnimation component, which gets triggered by isLoading=true
  }, []);

  const setProposal = useCallback((proposal: Proposal | null) => {
    if (proposal) {
        setProposalState(proposal);
        setIsLoading(false);
        router.push('/result');
    } else {
       setError("Received an empty proposal.");
       setIsLoading(false);
    }
  }, [router]);
  
  const handleStreamingError = useCallback((err: any) => {
      const errorMessage = err instanceof Error ? err.message : t('errors.unknown');
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('errors.generateProposalTitle'),
        description: errorMessage,
      });
      setIsLoading(false);
  }, [t, toast]);


  return (
    <ProposalContext.Provider value={{ proposal, isLoading, error, startProposalGeneration, setProposal, setIsLoading, setError, handleStreamingError }}>
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
