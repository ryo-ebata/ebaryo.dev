import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { Button as BaseButton } from '@base-ui-components/react/button';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-clip-padding text-sm font-medium outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-10 gap-1.5 px-4',
        xs: 'h-7 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs',
        sm: 'h-9 gap-1 rounded-[min(var(--radius-md),10px)] px-3',
        lg: 'h-11 gap-1.5 px-5',
        icon: 'size-10',
        'icon-xs': 'size-7 rounded-[min(var(--radius-md),8px)]',
        'icon-sm': 'size-9 rounded-[min(var(--radius-md),10px)]',
        'icon-lg': 'size-11',
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:border-destructive focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  render?: React.ReactElement<Record<string, unknown>>;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, render, size, variant, ...props }, ref) => (
    <BaseButton
      data-slot="button"
      className={cn(buttonVariants({ className, size, variant }))}
      ref={ref}
      render={render}
      nativeButton={render === undefined}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
