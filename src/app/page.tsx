import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center text-center pt-24 md:pt-32">
      <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight max-w-4xl">
        Smart Home Budget Planner
      </h1>
      <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
        AI-driven customization for your dream home. Input your needs, and let our AI craft the perfect smart home plan for your budget.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild size="lg">
          <Link href="/plan">
            Start Planning
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
