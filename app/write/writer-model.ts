export const STORAGE_KEY = 'ebaryo-local-writer-draft';

export interface DraftState {
  body: string;
  canonicalUrl: string;
  createdAt: string;
  description: string;
  draft: boolean;
  eyecatch?: { alt?: string; height?: number; url: string; width?: number } | null;
  noindex: boolean;
  seoTitle: string;
  slug: string;
  tags: string;
  title: string;
  updatedAt?: string;
}

export type MaintenanceIssue =
  | 'broken-link'
  | 'missing-eyecatch'
  | 'missing-tags'
  | 'orphaned'
  | 'short-content'
  | 'stale';

export interface ArticleSummary {
  description: string;
  draft: boolean;
  issues: MaintenanceIssue[];
  issueDetails: Partial<Record<MaintenanceIssue, string>>;
  progress: number;
  slug: string;
  stage: 'idea' | 'published' | 'review' | 'writing';
  tags: string[];
  title: string;
  updatedAt: string;
}

export interface LintMessage {
  column: number;
  fix?: { range: [number, number]; text: string };
  line: number;
  message: string;
  range: [number, number];
  ruleId: string;
  severity: number;
  suggestions?: Array<{
    fix: { range: [number, number]; text: string };
    id: string;
    message: string;
  }>;
}

export interface NoteHint {
  excerpt: string;
  modifiedAt: string;
  target: string;
  title: string;
}

export type ViewMode = 'edit' | 'split' | 'preview';
export type ArticlePickerMode =
  | 'all'
  | 'draft'
  | 'idea'
  | 'maintenance'
  | 'published'
  | 'review'
  | 'writing';
export type WritingStage = 'draft' | 'outline' | 'publish' | 'review';
export type SidePanel = 'analysis' | 'hints' | 'review' | 'settings' | null;
export type VisibleSidePanel = Exclude<SidePanel, null>;

export const createInitialState = (): DraftState => ({
  body: '',
  canonicalUrl: '',
  createdAt: new Date().toISOString().slice(0, 10),
  description: '',
  draft: true,
  noindex: false,
  seoTitle: '',
  slug: '',
  tags: '',
  title: '',
});

export const getLintCategory = (ruleId: string) => {
  if (ruleId.startsWith('ai-words-ja/')) return 'AIらしさ';
  if (ruleId === 'prh') return '表記';
  if (ruleId.includes('sentence-length') || ruleId.includes('max-')) return '読みやすさ';
  if (ruleId.includes('invalid') || ruleId.includes('nfd') || ruleId.includes('zero-width'))
    return '文字';
  return '日本語';
};

export const matchesArticlePickerMode = (item: ArticleSummary, mode: ArticlePickerMode) => {
  if (mode === 'all') return true;
  if (mode === 'draft') return item.draft;
  if (mode === 'maintenance') return !item.draft && item.issues.length > 0;
  if (mode === 'published') return !item.draft;
  return item.draft && item.stage === mode;
};
