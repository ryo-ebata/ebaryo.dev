interface LogContext {
  source: string;
  [key: string]: unknown;
}

/* Cache Componentsのprerenderは引数なしのnew Date()/Date.now()を「レンダー間で
   変わりうる値」として拒否し、ビルドを失敗させる。ログのtimestampは描画結果に
   影響しないテレメトリなので、Next.jsが検出しないperformance経由で絶対時刻を
   組み立てる(prerenderエラーが案内している[measure]の方法)。
   これが無いと、外部API失敗をlogger.errorで握り潰す箇所がビルドごと落とす。 */
const nowIso = (): string => new Date(performance.timeOrigin + performance.now()).toISOString();

const formatError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
};

export const logger = {
  error: (message: string, context: LogContext, error?: unknown): void => {
    const payload: Record<string, unknown> = {
      level: 'error',
      message,
      ...context,
      timestamp: nowIso(),
    };
    if (error !== undefined) {
      payload.error = formatError(error);
    }
    console.error(JSON.stringify(payload));
  },

  warn: (message: string, context: LogContext): void => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        ...context,
        timestamp: nowIso(),
      })
    );
  },
};
