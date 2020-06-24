import { urlToRequest } from 'loader-utils'

export function normalizeUrl(url: string, isStringValue: boolean) {
  let normalizedUrl = url

  if (isStringValue && /\\[\n]/.test(normalizedUrl)) {
    normalizedUrl = normalizedUrl.replace(/\\[\n]/g, '')
  }

  return urlToRequest(decodeURIComponent(unescape(normalizedUrl)))
}
