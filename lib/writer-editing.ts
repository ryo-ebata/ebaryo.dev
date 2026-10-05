export interface MarkdownEdit {
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export type InlineStyle = 'bold' | 'code' | 'link';

export const formatInlineMarkdown = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  style: InlineStyle
): MarkdownEdit => {
  const selected = value.slice(selectionStart, selectionEnd);
  const formats = {
    bold: { prefix: '**', suffix: '**', placeholder: '太字' },
    code: { prefix: '`', suffix: '`', placeholder: 'コード' },
    link: { prefix: '[', suffix: '](https://)', placeholder: 'リンク名' },
  } as const;
  const { prefix, suffix, placeholder } = formats[style];
  const content = selected || placeholder;
  const inserted = `${prefix}${content}${suffix}`;

  return {
    selectionEnd: selectionStart + prefix.length + content.length,
    selectionStart: selectionStart + prefix.length,
    value: `${value.slice(0, selectionStart)}${inserted}${value.slice(selectionEnd)}`,
  };
};

export const prefixMarkdownLines = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string
): MarkdownEdit => {
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const lineEndIndex = value.indexOf('\n', selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const selectedLines = value.slice(lineStart, lineEnd);
  const replacement = selectedLines
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
  const addedLength = replacement.length - selectedLines.length;

  return {
    selectionEnd: selectionEnd + addedLength,
    selectionStart: selectionStart + prefix.length,
    value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
  };
};

export const continueMarkdownLine = (value: string, cursor: number): MarkdownEdit | null => {
  const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
  const line = value.slice(lineStart, cursor);
  const match = line.match(/^(\s*)(?:(-\s+\[[ xX]\])|([-*+])|(\d+)([.)])|(>))\s+(.*)$/u);
  if (!match) return null;

  const [, indent, task, bullet, number, punctuation, quote, content] = match;
  if (!content.trim()) {
    return {
      selectionEnd: lineStart,
      selectionStart: lineStart,
      value: `${value.slice(0, lineStart)}${value.slice(cursor)}`,
    };
  }

  const marker = task
    ? '- [ ]'
    : bullet
      ? bullet
      : number
        ? `${Number(number) + 1}${punctuation}`
        : quote;
  const insertion = `\n${indent}${marker} `;
  return {
    selectionEnd: cursor + insertion.length,
    selectionStart: cursor + insertion.length,
    value: `${value.slice(0, cursor)}${insertion}${value.slice(cursor)}`,
  };
};
