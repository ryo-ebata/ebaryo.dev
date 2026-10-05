import { Coffee } from 'lucide-react';
import { buttonVariants } from '@/components/atoms/button';
import { cn } from '@/lib/utils';

const SUPPORT_URL = 'https://buymeacoffee.com/ryoebata';

export const BuyMeACoffee = () => (
  <aside className="mt-8 flex flex-col items-center gap-4 rounded-xl bg-card p-6 text-center text-card-foreground shadow-xs ring-1 ring-foreground/10">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Coffee className="size-4" aria-hidden="true" />
      <span className="text-sm font-medium">コーヒーで応援する</span>
    </div>
    <a
      className={cn(
        buttonVariants({ size: 'default' }),
        'bg-[#ffdd00] text-black hover:bg-[#f2cf00]'
      )}
      href={SUPPORT_URL}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Coffee className="size-4" aria-hidden="true" />
      Buy me a coffee
    </a>
  </aside>
);
