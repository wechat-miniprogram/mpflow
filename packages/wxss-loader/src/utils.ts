import path from 'path'

export function isUrlRequest(url: string, allowRoot = false): boolean {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !path.win32.isAbsolute(url)) return false
  if (/^\/\//.test(url) || /^[{}[\]#*;,'§$%&(=?`´^°<>]/.test(url)) return false
  return allowRoot || !url.startsWith('/')
}

export function urlToRequest(url: string): string {
  if (!url) return url
  const request = /^(?:[a-z]:[/\\]|\\\\|\.\.?\/)/i.test(url) ? url : `./${url}`
  return request.replace(/^[^?]*~/, '')
}

export function normalizeUrl(url: string, isStringValue: boolean) {
  let normalizedUrl = url

  if (isStringValue && /\\[\n]/.test(normalizedUrl)) {
    normalizedUrl = normalizedUrl.replace(/\\[\n]/g, '')
  }

  return urlToRequest(decodeURIComponent(unescape(normalizedUrl)))
}
