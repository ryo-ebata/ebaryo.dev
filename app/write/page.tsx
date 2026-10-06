import { Suspense } from 'react';
import { connection } from 'next/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Writer } from './writer';
import { getHostnameFromHost, isLocalHostname } from '@/lib/local-only';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: '記事を書く',
};

const LocalWriter = async () => {
  await connection();
  const host = (await headers()).get('host') ?? '';
  if (!isLocalHostname(getHostnameFromHost(host))) notFound();

  return <Writer />;
};

export default function WritePage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return (
    <Suspense fallback={null}>
      <LocalWriter />
    </Suspense>
  );
}
