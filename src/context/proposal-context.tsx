'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { generateProposalAction } from '@/app/actions';
import type { Proposal } from '@/lib/products';

interface ProposalContextType {
  proposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  generateProposal: (data: FormData) => Promise<void>;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const generateProposal = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateProposalAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      setProposal(result.proposal);
      router.push('/result');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error Generating Proposal',
        description: errorMessage,
      });
      setIsLoading(false);
    }
    // Don't set isLoading to false on success, as the user will be navigated away.
  };

  return (
    <ProposalContext.Provider value={{ proposal, isLoading, error, generateProposal }}>
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
