import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '6xl';

interface ContainerProps {
  children: ReactNode;
  maxWidth?: ContainerMaxWidth;
}

const maxWidthClasses: Record<ContainerMaxWidth, string> = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  lg: 'max-w-lg',
  md: 'max-w-md',
  sm: 'max-w-sm',
  xl: 'max-w-xl',
} as const;

export const Container = ({ children, maxWidth = '4xl' }: ContainerProps) => (
  <div className="site-shell min-h-screen w-full min-w-0">
    <div
      className={cn(
        'page-canvas mx-auto w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12 lg:px-8',
        maxWidthClasses[maxWidth]
      )}
    >
      {children}
    </div>
  </div>
);
