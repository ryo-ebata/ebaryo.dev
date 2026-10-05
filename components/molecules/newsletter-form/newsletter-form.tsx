'use client';

import { type FormEvent, useState } from 'react';

import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { isNewsletterEnabled } from '@/config/newsletter';
import { trackProductEvent } from '@/lib/analytics';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface SubscribeResponse {
  ok: boolean;
  message?: string;
}

/**
 * ニュースレター購読フォーム。NEXT_PUBLIC_NEWSLETTER_ENABLED=true のときのみ表示。
 * 送信は /api/newsletter プロキシ経由。bot 対策にハニーポット(website)を仕込む。
 */
export const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  if (!isNewsletterEnabled) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });
      const data = (await response.json()) as SubscribeResponse;
      setStatus(data.ok ? 'success' : 'error');
      setMessage(data.message ?? '');
      if (data.ok) {
        trackProductEvent('newsletter_subscribed', { placement: 'article_bottom' });
        setEmail('');
      }
    } catch {
      setStatus('error');
      setMessage('通信エラーが発生しました。');
    }
  };

  return (
    <section className="not-prose overflow-hidden rounded-xl bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <h2 className="text-lg font-semibold text-foreground">ニュースレター購読</h2>
      <p className="mt-1 text-sm text-muted-foreground">新着記事や気づきをメールでお届けします。</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        {/* ハニーポット(視覚的に隠す。bot が埋めたら黙殺) */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="sr-only"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
        <Input
          type="email"
          required
          placeholder="you@example.com"
          aria-label="メールアドレス"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="sm:flex-1"
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '送信中...' : '購読する'}
        </Button>
      </form>
      <div aria-live="polite" aria-atomic="true">
        {status === 'success' && <p className="mt-2 text-sm text-success">{message}</p>}
        {status === 'error' && <p className="mt-2 text-sm text-destructive">{message}</p>}
      </div>
    </section>
  );
};
