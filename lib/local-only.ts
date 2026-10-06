const LOCAL_HOSTNAMES = new Set(['localhost', '::1', '[::1]']);

export const getHostnameFromHost = (host: string): string => {
  if (!host.startsWith('[')) return host.split(':')[0];
  const closingBracket = host.indexOf(']');
  return closingBracket === -1 ? host : host.slice(1, closingBracket);
};

export const isLocalHostname = (hostname: string): boolean =>
  LOCAL_HOSTNAMES.has(hostname) || hostname.startsWith('127.');
