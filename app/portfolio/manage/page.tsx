import { Suspense } from 'react';
import { connection } from 'next/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { PortfolioManager } from './portfolio-manager';
import { portfolioItems } from '@/config/portfolio';
import { githubContributions } from '@/config/github-contributions';
import { getHostnameFromHost, isLocalHostname } from '@/lib/local-only';

const LocalPortfolioManager = async () => {
  await connection();
  const host = (await headers()).get('host') ?? '';
  if (!isLocalHostname(getHostnameFromHost(host))) notFound();

  return (
    <PortfolioManager initialContributions={githubContributions} initialItems={portfolioItems} />
  );
};

const PortfolioManagePage = () => {
  if (process.env.NODE_ENV !== 'development') notFound();

  return (
    <Suspense fallback={null}>
      <LocalPortfolioManager />
    </Suspense>
  );
};

export default PortfolioManagePage;
