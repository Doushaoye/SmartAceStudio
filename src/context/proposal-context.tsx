'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal } from '@/lib/products';

interface ProposalContextType {
  proposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  setProposal: (proposal: Proposal | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [proposal, setProposalState] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const setProposal = useCallback((newProposal: Proposal | null) => {
    setProposalState(newProposal);
    if (newProposal) {
        setIsLoading(false);
        setError(null);
        router.push('/result');
    }
  }, [router]);
  
  return (
    <ProposalContext.Provider value={{ proposal, isLoading, error, setProposal, setIsLoading, setError }}>
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
