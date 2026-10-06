const BEARER_PREFIX = 'Bearer ';

export const isValidRevalidationAuthorization = (
  authorization: string | null,
  expectedSecret: string | undefined
) => {
  if (!expectedSecret || !authorization?.startsWith(BEARER_PREFIX)) return false;
  return authorization.slice(BEARER_PREFIX.length) === expectedSecret;
};
