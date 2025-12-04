export const extractFileNameFromUrl = (url?: string, fallback = 'PDF实验文档'): string => {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';
    const decoded = decodeURIComponent(lastSegment);
    const cleaned = decoded.replace(/^\d+_/, '');
    return cleaned || fallback;
  } catch {
    try {
      const decoded = decodeURIComponent(url.split('/').pop() || '');
      const cleaned = decoded.replace(/^\d+_/, '');
      return cleaned || fallback;
    } catch {
      return fallback;
    }
  }
};

export const isHttpUrl = (value?: string | null): boolean => {
  if (!value || typeof value !== 'string') return false;
  const text = value.trim();
  return text.startsWith('http://') || text.startsWith('https://');
};
