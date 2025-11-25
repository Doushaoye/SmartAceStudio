'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal } from '@/lib/products';
import { generateProposalAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface ProposalContextType {
  proposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  startProposalGeneration: (formData: FormData) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const startProposalGeneration = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setProposal(null);

    const result = await generateProposalAction(formData);
    
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      toast({
        variant: 'destructive',
        title: "Error Generating Proposal",
        description: result.error,
      });
    } else if (result.proposal) {
      setProposal(result.proposal);
      router.push('/result');
    }
  }, [router, toast]);
  
  return (
    <ProposalContext.Provider value={{ proposal, isLoading, error, startProposalGeneration }}>
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
