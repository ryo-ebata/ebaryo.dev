import { Suspense } from 'react';
import { connection } from 'next/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { PortfolioManager } from './portfolio-manager';
import { portfolioItems } from '@/config/portfolio';
import { githubContributions } from '@/config/github-contributions';
import { isLocalHostname } from '@/lib/local-only';

const LocalPortfolioManager = async () => {
  await connection();
  const host = (await headers()).get('host') ?? '';
  const hostname = host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.split(':')[0];
  if (process.env.NODE_ENV !== 'development' || !isLocalHostname(hostname)) notFound();

  return (
    <PortfolioManager initialContributions={githubContributions} initialItems={portfolioItems} />
  );
};

const PortfolioManagePage = () => (
  <Suspense fallback={null}>
    <LocalPortfolioManager />
  </Suspense>
);

export default PortfolioManagePage;
