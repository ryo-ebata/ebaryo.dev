'use client';

import { useEffect } from 'react';
import { trackProductEvent } from '@/lib/analytics';

const ARTICLE_SELECTOR = '[data-article-body]';
const READ_PROGRESS_THRESHOLD = 0.5;
const ACTIVE_READING_SECONDS = 120;
const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_RETURN_GAP_MS = 30 * 60 * 1000;
const LAST_VISIT_KEY = 'blog:last-visit-at';
const SESSION_VISIT_KEY = 'blog:visit-recorded';
type StorageName = 'localStorage' | 'sessionStorage';

const readStorage = (storageName: StorageName, key: string): string | null => {
  try {
    return window[storageName].getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (storageName: StorageName, key: string, value: string): void => {
  try {
    window[storageName].setItem(key, value);
  } catch {}
};

interface ArticleEngagementTrackerProps {
  slug: string;
}

export const ArticleEngagementTracker = ({ slug }: ArticleEngagementTrackerProps) => {
  useEffect(() => {
    const valueEventKey = `blog:article-value:${slug}`;
    let valueTracked = Boolean(readStorage('sessionStorage', valueEventKey));

    const trackValueReached = (qualificationMethod: 'active_2_minutes' | 'read_50_percent') => {
      if (valueTracked) {
        return;
      }

      valueTracked = true;
      writeStorage('sessionStorage', valueEventKey, qualificationMethod);
      trackProductEvent('article_value_reached', {
        article_slug: slug,
        qualification_method: qualificationMethod,
      });
    };

    const recordVisit = () => {
      if (readStorage('sessionStorage', SESSION_VISIT_KEY)) {
        return;
      }

      const now = Date.now();
      const lastVisitAt = Number(readStorage('localStorage', LAST_VISIT_KEY));
      const elapsed = now - lastVisitAt;
      if (
        Number.isFinite(lastVisitAt) &&
        lastVisitAt > 0 &&
        elapsed >= MIN_RETURN_GAP_MS &&
        elapsed <= RETURN_WINDOW_MS
      ) {
        trackProductEvent('reader_returned', {
          article_slug: slug,
          days_since_last_visit: Math.floor(elapsed / (24 * 60 * 60 * 1000)),
        });
      }

      writeStorage('localStorage', LAST_VISIT_KEY, String(now));
      writeStorage('sessionStorage', SESSION_VISIT_KEY, 'true');
    };

    const checkReadProgress = () => {
      const article = document.querySelector<HTMLElement>(ARTICLE_SELECTOR);
      if (!article || article.offsetHeight === 0) {
        return;
      }

      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const viewportBottom = window.scrollY + window.innerHeight;
      const progress = (viewportBottom - articleTop) / article.offsetHeight;
      if (progress >= READ_PROGRESS_THRESHOLD) {
        trackValueReached('read_50_percent');
      }
    };

    recordVisit();
    checkReadProgress();
    window.addEventListener('scroll', checkReadProgress, { passive: true });
    window.addEventListener('resize', checkReadProgress);

    let activeSeconds = 0;
    const activeReadingTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      activeSeconds += 1;
      if (activeSeconds >= ACTIVE_READING_SECONDS) {
        trackValueReached('active_2_minutes');
        window.clearInterval(activeReadingTimer);
      }
    }, 1000);

    return () => {
      window.removeEventListener('scroll', checkReadProgress);
      window.removeEventListener('resize', checkReadProgress);
      window.clearInterval(activeReadingTimer);
    };
  }, [slug]);

  return null;
};
