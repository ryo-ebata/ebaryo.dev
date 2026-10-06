import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex min-h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 text-xs font-medium leading-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        outline:
          'border-border text-foreground [a&]:hover:bg-muted [a&]:hover:text-muted-foreground',
        destructive: 'bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90',
        success: 'bg-success text-success-foreground [a&]:hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground [a&]:hover:bg-warning/90',
        info: 'bg-info text-info-foreground [a&]:hover:bg-info/90',
        ghost: 'text-foreground hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
      },
    },
  }
);

const Badge = ({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) => (
  <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
