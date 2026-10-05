'use client';

import { useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Menu, PenLine, Wrench, X } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { ThemeToggle } from '@/components/atoms/theme-toggle/theme-toggle';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { isLocalHostname } from '@/lib/local-only';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_MENU_ID = 'header-nav-menu';
const navigationItems = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/about', icon: 'about', label: 'About' },
  { href: '/portfolio', icon: 'portfolio', label: 'Portfolio' },
  { href: '/blog', icon: 'blog', label: 'Blog' },
] as const;

type NavigationIcon = (typeof navigationItems)[number]['icon'];

const GeometricNavIcon = ({ icon }: { icon: NavigationIcon }) => (
  <svg
    aria-hidden="true"
    className="size-4 shrink-0 overflow-visible transition-transform duration-200 group-hover/nav:rotate-6"
    fill="none"
    viewBox="0 0 16 16"
  >
    {icon === 'home' && (
      <>
        <path d="M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5Z" stroke="currentColor" />
        <rect x="6.25" y="6.25" width="3.5" height="3.5" fill="currentColor" />
      </>
    )}
    {icon === 'about' && (
      <>
        <circle cx="8" cy="8" r="6" stroke="currentColor" />
        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeDasharray="2 2" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      </>
    )}
    {icon === 'portfolio' && (
      <>
        <rect x="1.5" y="4.5" width="8" height="8" stroke="currentColor" />
        <rect x="6.5" y="1.5" width="8" height="8" stroke="currentColor" />
        <path d="M9.5 9.5 6.5 12.5" stroke="currentColor" />
      </>
    )}
    {icon === 'blog' && (
      <>
        <path d="M2 3.5h9M2 8h12M2 12.5h7" stroke="currentColor" />
        <rect x="11" y="1.5" width="3" height="3" fill="currentColor" />
        <path d="m11.5 11 2.5 1.5-2.5 1.5Z" fill="currentColor" />
      </>
    )}
  </svg>
);

const getLinkClassName = (isActive: boolean): string =>
  cn(
    'group/nav relative inline-flex items-center gap-1.5 whitespace-nowrap px-1 py-2 text-sm transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-px after:origin-left after:bg-primary after:transition-transform',
    isActive
      ? 'font-semibold text-primary after:scale-x-100'
      : 'text-muted-foreground after:scale-x-0 hover:text-foreground hover:after:scale-x-100'
  );

interface NavLinkProps {
  href: string;
  icon: NavigationIcon;
  isActive: boolean;
  label: string;
}

const NavLink = ({ href, icon, isActive, label }: NavLinkProps) => (
  <Link
    href={href}
    aria-current={isActive ? 'page' : undefined}
    className={getLinkClassName(isActive)}
  >
    <GeometricNavIcon icon={icon} />
    {label}
  </Link>
);

interface NavigationProps {
  isMenuOpen: boolean;
  pathname: string;
}

const Navigation = ({ isMenuOpen, pathname }: NavigationProps) => (
  <nav
    id={NAV_MENU_ID}
    className={cn(
      'absolute inset-x-0 top-full flex-col items-start gap-4 border-t border-foreground/10 bg-background px-4 py-4',
      isMenuOpen ? 'flex' : 'hidden',
      'sm:static sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:gap-6'
    )}
  >
    {navigationItems.map((item) => (
      <NavLink
        key={item.href}
        href={item.href}
        icon={item.icon}
        isActive={pathname === item.href}
        label={item.label}
      />
    ))}
    <ThemeToggle />
  </nav>
);

const SiteLogo = () => (
  <Link
    href="/"
    className="group/logo flex shrink-0 items-center gap-3 whitespace-nowrap text-lg font-bold text-foreground transition-colors hover:text-primary sm:text-xl"
  >
    <span
      className="relative grid size-8 place-items-center border border-primary/70 bg-primary/10 transition-transform group-hover/logo:rotate-45"
      aria-hidden="true"
    >
      <span className="absolute left-1 top-1 size-2 bg-primary" />
      <span className="absolute bottom-1 right-1 size-2 rotate-45 border border-[var(--geometry-secondary)]" />
    </span>
    <span>{siteConfig.name}</span>
  </Link>
);

const LocalTools = () => {
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    setIsLocal(isLocalHostname(window.location.hostname));
  }, []);

  if (!isLocal) return null;

  return (
    <div className="border-t border-dashed border-primary/20 bg-primary/[0.04]">
      <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <span className="mr-1 inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          <Wrench className="size-3" aria-hidden="true" />
          Local
        </span>
        <Link
          href="/write"
          className="inline-flex shrink-0 items-center gap-1.5 border border-foreground/10 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          <PenLine className="size-3.5" aria-hidden="true" />
          記事管理
        </Link>
        <Link
          href="/portfolio/manage"
          className="inline-flex shrink-0 items-center gap-1.5 border border-foreground/10 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
          Portfolio管理
        </Link>
      </div>
    </div>
  );
};

interface MenuToggleButtonProps {
  isMenuOpen: boolean;
  onClick: () => void;
}

const MenuToggleButton = ({ isMenuOpen, onClick }: MenuToggleButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    className="cursor-pointer sm:hidden"
    aria-expanded={isMenuOpen}
    aria-controls={NAV_MENU_ID}
    onClick={onClick}
  >
    {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
    <span className="sr-only">メニューを{isMenuOpen ? '閉じる' : '開く'}</span>
  </Button>
);

const useCloseMenuOnNavigate = (pathname: string, setIsMenuOpen: (open: boolean) => void) => {
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname, setIsMenuOpen]);
};

const useCloseMenuOnOutsideInteraction = (
  isMenuOpen: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
  setIsMenuOpen: (open: boolean) => void
) => {
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, containerRef, setIsMenuOpen]);
};

export const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useCloseMenuOnNavigate(pathname, setIsMenuOpen);
  useCloseMenuOnOutsideInteraction(isMenuOpen, containerRef, setIsMenuOpen);

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/15 bg-background/90 backdrop-blur-xl">
      <div
        ref={containerRef}
        className="relative mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 before:absolute before:bottom-[-1px] before:left-4 before:h-[3px] before:w-16 before:bg-primary after:absolute after:bottom-[-4px] after:left-24 after:size-2 after:rotate-45 after:bg-[var(--geometry-secondary)] sm:px-6 lg:px-8"
      >
        <SiteLogo />
        <MenuToggleButton isMenuOpen={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)} />
        <Navigation isMenuOpen={isMenuOpen} pathname={pathname} />
      </div>
      <LocalTools />
    </header>
  );
};
