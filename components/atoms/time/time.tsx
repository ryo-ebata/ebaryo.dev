'use client';

import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';

interface TimeProps {
  date: string;
  label?: string;
}

export const Time = ({ date, label }: TimeProps) => (
  <time
    dateTime={date}
    className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground')}
  >
    <Calendar className="size-4 shrink-0" />
    {label && <span>{label}</span>}
    {formatDate(date)}
  </time>
);
