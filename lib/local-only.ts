const LOCAL_HOSTNAMES = new Set(['localhost', '::1', '[::1]']);

export const isLocalHostname = (hostname: string): boolean =>
  LOCAL_HOSTNAMES.has(hostname) || hostname.startsWith('127.');
