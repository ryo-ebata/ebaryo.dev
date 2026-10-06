/* next/cacheはNext.jsのレンダリング文脈でのみ動作するため、
   vitestではキャッシュを迂回してテスト対象関数をそのまま実行する。 */
export const cacheLife = (): void => {};
export const cacheTag = (): void => {};
export const revalidatePath = (): void => {};
export const revalidateTag = (): void => {};
export const unstable_cache = <Arguments extends unknown[], Result>(
  callback: (...arguments_: Arguments) => Promise<Result>
) => callback;
