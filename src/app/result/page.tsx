'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProposal } from '@/context/proposal-context';
import { ResultDashboard } from '@/components/result/result-dashboard';

export default function ResultPage() {
  const { proposal, isLoading } = useProposal();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !proposal) {
      router.replace('/plan');
    }
  }, [proposal, isLoading, router]);

  if (isLoading || !proposal) {
    // Or a loading spinner
    return (
        <div className="flex items-center justify-center h-full">
            {/* Can show a skeleton loader here */}
        </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <ResultDashboard proposal={proposal} />
    </div>
  );
}
