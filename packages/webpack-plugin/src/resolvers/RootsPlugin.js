import forEachBail from 'enhanced-resolve/lib/forEachBail'
import { ensureHook, getHook } from './utils'

export default class RootsPlugin {
  /**
   * @param {string} source source hook
   * @param {Set<string>} roots roots
   * @param {string} target target hook
   */
  constructor(source, roots, target) {
    this.roots = Array.from(roots)
    this.source = source
    this.target = target
  }

  /**
   * @param {Resolver} resolver the resolver
   * @returns {void}
   */
  apply(resolver) {
    const target = ensureHook(resolver, this.target)

    getHook(resolver, this.source).tapAsync('RootsPlugin', (request, resolveContext, callback) => {
      const req = request.request
      if (!req) return callback()
      if (!req.startsWith('/')) return callback()

      forEachBail(
        this.roots,
        (root, callback) => {
          const path = resolver.join(root, req.slice(1))
          const obj = {
            ...request,
            path,
            relativePath: request.relativePath && path,
          }
          resolver.doResolve(target, obj, `root path ${root}`, resolveContext, callback)
        },
        callback,
      )
    })
  }
}
