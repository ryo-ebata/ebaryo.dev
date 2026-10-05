import { z } from 'zod';
import portfolioData from '@/data/portfolio.json';

export const portfolioCategorySchema = z.enum([
  'open-source',
  'contribution',
  'product',
  'podcast',
  'talk',
]);

export const portfolioLinkSchema = z.object({
  href: z.url(),
  label: z.string().trim().min(1).max(30),
});

export const portfolioItemSchema = z.object({
  category: portfolioCategorySchema,
  description: z.string().trim().min(1).max(500),
  featured: z.boolean().optional(),
  links: z.array(portfolioLinkSchema).min(1).max(5),
  role: z.string().trim().min(1).max(80),
  tags: z.array(z.string().trim().min(1).max(30)).max(8),
  title: z.string().trim().min(1).max(100),
  year: z.number().int().min(2000).max(2100),
});

export const portfolioItemsSchema = z.array(portfolioItemSchema).max(100);

export type PortfolioCategory = z.infer<typeof portfolioCategorySchema>;
export type PortfolioLink = z.infer<typeof portfolioLinkSchema>;
export type PortfolioItem = z.infer<typeof portfolioItemSchema>;

export const portfolioCategoryLabels: Record<PortfolioCategory, string> = {
  'open-source': '自作OSS',
  contribution: 'OSS Contribution',
  product: '個人開発',
  podcast: 'Podcast',
  talk: '登壇・資料',
};

export const portfolioItems = portfolioItemsSchema.parse(portfolioData);
