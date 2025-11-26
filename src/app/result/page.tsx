'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProposal } from '@/context/proposal-context';
import { ResultDashboard } from '@/components/result/result-dashboard';
import { ContactSection } from '@/components/contact-section';
import { LoadingAnimation } from '@/components/plan/loading-animation';

export default function ResultPage() {
  const { proposal, isLoading } = useProposal();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's still no proposal, redirect to plan page.
    if (!isLoading && !proposal) {
      router.replace('/plan');
    }
  }, [proposal, isLoading, router]);

  if (isLoading || !proposal) {
    // Show loading animation while waiting for the proposal
    return <LoadingAnimation />;
  }

  return (
    <>
      <div className="container py-8 md:py-12">
        <ResultDashboard proposal={proposal} />
      </div>
      <ContactSection />
    </>
  );
}
