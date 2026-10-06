const baseUrl = process.env.CLOUDFLARE_PREVIEW_URL ?? 'http://127.0.0.1:8788';
const paths = ['/', '/blog', '/portfolio', '/about', '/blog/typescript-v7'];
const rounds = 10;

const requests = Array.from({ length: rounds }, () =>
  paths.map(async (pathname) => {
    const response = await fetch(`${baseUrl}${pathname}`);
    const body = await response.text();
    return {
      bytes: body.length,
      contentType: response.headers.get('content-type'),
      isHtmlDocument: body.startsWith('<!DOCTYPE html>'),
      pathname,
      status: response.status,
    };
  })
).flat();

const results = await Promise.all(requests);
const failures = results.filter(
  ({ bytes, contentType, isHtmlDocument, status }) =>
    status !== 200 || bytes < 20 || !contentType?.startsWith('text/html') || !isHtmlDocument
);

console.log(
  JSON.stringify(
    {
      failures,
      minimumBytes: Math.min(...results.map(({ bytes }) => bytes)),
      requests: results.length,
    },
    null,
    2
  )
);

if (failures.length > 0) process.exitCode = 1;
