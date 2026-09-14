// WXML URLs keep project-root requests; a tilde before the query denotes a package request.
export function urlToRequest(url: string): string {
  if (!url) return url
  const request = /^(?:[a-z]:[/\\]|\\\\|\/|\.\.?\/)/i.test(url) ? url : `./${url}`
  return request.replace(/^[^?]*~/, '')
}

// loader-utils 3 defaults to xxhash64; keep existing output filenames for implicit hashes.
export function preserveHashAlgorithm(name: string): string {
  return name.replace(/\[(?:([^[:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi, (match, algorithm) =>
    algorithm ? match : `[md4:${match.slice(1)}`,
  )
}
