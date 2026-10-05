import { JsonLd } from '@/components/jsonld/jsonld';
import { Skeleton } from '@/components/atoms';
import { Container } from '@/components/organisms';
import { siteConfig } from '@/config/site';
import { generateWebSiteJsonLd } from '@/lib/jsonld';
import { generateMetadata as generatePageMetadata } from '@/lib/metadata';
import { Suspense } from 'react';
import { HomeContainer } from './container';

export const metadata = generatePageMetadata({
  description: siteConfig.description,
  title: siteConfig.name,
  url: siteConfig.url,
});

const HomeFallback = () => (
  <Container maxWidth="4xl">
    <div className="space-y-16" aria-label="ホームを読み込み中">
      <div className="grid min-h-[35rem] grid-cols-1 border-y border-border md:grid-cols-2">
        <div className="flex flex-col justify-center space-y-5 py-16 md:pr-8">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-28 w-full max-w-sm" />
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-11 w-36" />
        </div>
        <Skeleton className="hidden rounded-none md:block" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-24 w-full max-w-2xl" />
        <Skeleton className="h-14 w-full max-w-xl" />
      </div>
    </div>
  </Container>
);

const Home = () => {
  const webSiteJsonLd = generateWebSiteJsonLd();

  return (
    <>
      <JsonLd data={webSiteJsonLd} />
      <Suspense fallback={<HomeFallback />}>
        <HomeContainer />
      </Suspense>
    </>
  );
};

export default Home;
