declare global {
  interface Window {
    __TRACECORE_CONFIG__?: {
      apiPath?: string;
    };
  }
}

const DEFAULT_API_PATH = '/api/v1';

export function runtimeApiPath(): string {
  const configuredPath = window.__TRACECORE_CONFIG__?.apiPath;
  if (configuredPath === undefined) return DEFAULT_API_PATH;

  const path = configuredPath.trim();
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[?#\\\s"'<>]/.test(path) ||
    /(^|\/)\.\.?($|\/)/.test(path)
  ) {
    throw new Error('API_PATH debe ser una ruta del mismo origen, por ejemplo /api/v1.');
  }

  return path.replace(/\/+$/, '') || DEFAULT_API_PATH;
}
