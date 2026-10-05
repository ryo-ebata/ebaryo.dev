interface AffiliateClickParams {
  store: string;
  product?: string;
  placement?: string;
}

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

export type ProductEventName =
  | 'article_value_reached'
  | 'content_link_click'
  | 'newsletter_subscribed'
  | 'reader_returned';

type DataLayerEntry = Record<string, unknown>;

/**
 * GTM の dataLayer へプロダクトイベントを送る。
 * GTM 未導入時も dataLayer へ保持し、ブラウザ動作は阻害しない。
 */
export const trackProductEvent = (
  event: ProductEventName,
  params: Record<string, unknown> = {}
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const analyticsWindow = window as unknown as { dataLayer?: DataLayerEntry[] };
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.dataLayer.push({ event, ...params });
};

/**
 * アフィリエイトリンクのクリックを GA4 の affiliate_click カスタムイベントとして送信する。
 * gtag 未ロード時(GA4 未導入)は no-op になり、導入後に自動で計測が始まる。
 */
export const trackAffiliateClick = ({ store, product, placement }: AffiliateClickParams): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'affiliate_click', { store, product, placement });
  }
};

const CLS_SCALE = 1000;

interface WebVitalParams {
  name: string;
  value: number;
  rating?: string;
  id: string;
}

/**
 * Core Web Vitals 計測値を GA4 に送信する。gtag 未ロード時は no-op。
 * CLS は小数のため整数化(×1000)して送る(GA4 のイベント値は整数)。
 */
export const reportWebVital = ({ name, value, rating, id }: WebVitalParams): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', name, {
      metric_id: id,
      metric_rating: rating,
      metric_value: value,
      non_interaction: true,
      value: Math.round(name === 'CLS' ? value * CLS_SCALE : value),
    });
  }
};
