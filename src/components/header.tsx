import Link from 'next/link';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-40 items-center">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-bold font-headline hidden sm:inline-block">智装，就找智装侠</span>
        </Link>
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
