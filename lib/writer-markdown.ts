import { toAmazonAffiliateUrl } from './amazon-affiliate';

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/giu;

const normalizeTextSegment = (value: string, associateTag?: string) =>
  value
    .replace(/<((?:https?:\/\/|mailto:)[^<>\s]+)>/giu, '$1')
    .replace(URL_PATTERN, (url) => toAmazonAffiliateUrl(url, associateTag));

export const normalizeWriterMarkdown = (markdown: string, associateTag?: string) => {
  let fenced = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(?:```|~~~)/u.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      return line
        .split(/(`[^`]*`)/u)
        .map((segment, index) =>
          index % 2 === 0 ? normalizeTextSegment(segment, associateTag) : segment
        )
        .join('');
    })
    .join('\n');
};
