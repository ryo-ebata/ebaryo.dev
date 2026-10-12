const PROJECT_PATTERN =
  /(?:Hajimari|Orion|Mayer|Bridge|PPR|HRU|単月目標|下半期|上半期|評価期間|案件|面談|契約手続き|人材サーチ|ロールマスタ|週次|ボミー|加藤|金城|大島)/iu;
const MALFORMED_NAME_PATTERN = /(?:\{!|&node|resource !|^[\s]+|!\s{2,}|\.jsx\.md$)/u;
const DATE_PATTERN = /(?:^|\D)(?:20\d{2})[-/年]|\d{1,2}[!/月]\d{1,2}/u;
const DOCUMENT_FRAGMENT_PATTERN = /^\d+(?:\.\d+)*\.?\s+/u;
const HEPTABASE_TUTORIAL_PATTERN =
  /^(?:A card |All cards |Cards can |Draw a |Right-click |Tag’s |You can use )/u;

const countMatches = (content, pattern) => [...content.matchAll(pattern)].length;

export const classifyHeptabaseCard = ({ content, name }) => {
  const body = content.replace(/^#.*(?:\r?\n|$)/u, '').trim();
  const externalLinks = countMatches(body, /https?:\/\/[^\s)>]+/gu);
  const headings = countMatches(body, /^#{1,6}\s+/gmu);
  const tasks = countMatches(body, /^\s*[-*]\s+\[[ xX]\]/gmu);
  const projectSignals = PROJECT_PATTERN.test(name) ? 1 : 0;

  if (
    MALFORMED_NAME_PATTERN.test(name) ||
    HEPTABASE_TUTORIAL_PATTERN.test(name) ||
    name.length > 120
  ) {
    return {
      bucket: 'archive-candidate',
      confidence: 'certain',
      reason: '壊れた、またはコード・Heptabase説明由来のファイル名',
    };
  }
  if (DATE_PATTERN.test(name) || tasks > 0 || projectSignals > 0) {
    return {
      bucket: 'project-candidate',
      confidence: 'certain',
      reason: '日付・タスク・業務固有語を含む',
    };
  }
  if (DOCUMENT_FRAGMENT_PATTERN.test(name)) {
    return {
      bucket: 'source-candidate',
      confidence: 'certain',
      reason: '連番付きの章・節断片',
    };
  }
  if (externalLinks > 0) {
    return {
      bucket: 'source-candidate',
      confidence: 'review',
      reason: '外部URLを含む資料性の高い内容',
    };
  }
  if (body.length >= 20 && body.length <= 1_200 && headings <= 2) {
    return {
      bucket: 'atomic-candidate',
      confidence: 'review',
      reason: '短く単一テーマに収まる',
    };
  }
  return {
    bucket: 'inbox-candidate',
    confidence: 'review',
    reason: '機械判定では用途を確定できない',
  };
};
