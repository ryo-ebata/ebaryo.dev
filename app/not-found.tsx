import { Link } from 'next-view-transitions';

import { buttonVariants } from '@/components/atoms/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/atoms';
import { Container } from '@/components/organisms';

export default function NotFound() {
  return (
    <Container maxWidth="2xl">
      <Empty className="geometric-panel my-12 min-h-[60vh]">
        <EmptyHeader>
          <p className="text-7xl font-bold tracking-[-0.06em] text-foreground">404</p>
          <EmptyTitle className="text-xl text-muted-foreground">ページがない</EmptyTitle>
          <EmptyDescription>URLが違うか、ページを移動した可能性がある。</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/" className={buttonVariants()}>
            ホームに戻る
          </Link>
        </EmptyContent>
      </Empty>
    </Container>
  );
}
