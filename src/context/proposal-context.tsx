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
  generateProposal: (data: FormData) => void;
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

  const generateProposal = useCallback((data: FormData) => {
    setIsLoading(true);
    setError(null);
    // The actual generation is now handled by the LoadingAnimation component
  }, []);

  const setProposal = useCallback((proposal: Proposal | null) => {
    setProposalState(proposal);
    if (proposal) {
        setIsLoading(false);
        router.push('/result');
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
    <ProposalContext.Provider value={{ proposal, isLoading, error, generateProposal, setProposal, setIsLoading, setError, handleStreamingError }}>
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
