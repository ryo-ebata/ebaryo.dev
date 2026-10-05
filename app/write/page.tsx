import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Writer } from './writer';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: '記事を書く',
};

export default function WritePage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <Writer />;
}
