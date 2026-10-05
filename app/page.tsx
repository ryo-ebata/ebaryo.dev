import { JsonLd } from '@/components/jsonld/jsonld';
import { Skeleton } from '@/components/atoms';
import { ArticleCardSkeleton, Container } from '@/components/organisms';
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
    <div className="space-y-12" aria-label="記事を読み込み中">
      <div className="mb-12 flex flex-col items-center space-y-3">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-7 w-24" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
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
