const DEV_API_BASE_URL = 'http://localhost:6868';
const DEV_NGSPICE_API_URL = 'http://localhost:3001/simulate';
const DEV_DIGITAL_SIM_API_URL = 'http://localhost:3002/simulate/digital';

const isBrowser = typeof window !== 'undefined';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isLoopbackHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
};

const tryParseAbsoluteUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const normalizeConfiguredEndpoint = (value: string | undefined, label: string) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = tryParseAbsoluteUrl(trimmed);
  if (parsed && import.meta.env.PROD && isLoopbackHost(parsed.hostname)) {
    console.warn(`[runtimeConfig] ignore ${label}=${trimmed} in production because it points to loopback.`);
    return null;
  }

  return trimTrailingSlash(trimmed);
};

const resolveBrowserOrigin = () => {
  if (!isBrowser) return null;
  return trimTrailingSlash(window.location.origin);
};

const buildServiceUrlFromOrigin = (origin: string, port: number, pathname: string) => {
  const url = new URL(origin);
  url.port = String(port);
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return trimTrailingSlash(url.toString());
};

export const BASE_URL =
  normalizeConfiguredEndpoint(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL') ||
  (import.meta.env.PROD ? resolveBrowserOrigin() : DEV_API_BASE_URL) ||
  DEV_API_BASE_URL;

const backendOrigin = trimTrailingSlash(BASE_URL);
const browserOrigin = resolveBrowserOrigin();
const serviceOrigin = tryParseAbsoluteUrl(backendOrigin) ? backendOrigin : browserOrigin;

export const NGSPICE_SIM_API_URL =
  normalizeConfiguredEndpoint(import.meta.env.VITE_NGSPICE_API_URL, 'VITE_NGSPICE_API_URL') ||
  (serviceOrigin ? buildServiceUrlFromOrigin(serviceOrigin, 3001, '/simulate') : DEV_NGSPICE_API_URL);

export const DIGITAL_SIM_API_URL =
  normalizeConfiguredEndpoint(import.meta.env.VITE_DIGITAL_SIM_API_URL, 'VITE_DIGITAL_SIM_API_URL') ||
  (serviceOrigin ? buildServiceUrlFromOrigin(serviceOrigin, 3002, '/simulate/digital') : DEV_DIGITAL_SIM_API_URL);
