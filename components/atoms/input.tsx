import { Input as BaseInput } from '@base-ui-components/react/input';

import { cn } from '@/lib/utils';

const Input = ({ className, type, ...props }: React.ComponentProps<'input'>) => (
  <BaseInput
    type={type}
    data-slot="input"
    className={cn(
      'h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:bg-background/40 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground md:text-sm',
      className
    )}
    {...props}
  />
);

export { Input };
