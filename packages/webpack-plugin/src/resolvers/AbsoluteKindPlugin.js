import { ensureHook, getHook } from './utils'

/**
 * 检查是否是绝对路径
 */
export default class AbsoluteKindPlugin {
  constructor(source, target) {
    this.source = source
    this.target = target
  }

  apply(resolver) {
    const target = ensureHook(resolver, this.target)
    getHook(resolver, this.source).tapAsync('AbsoluteKindPlugin', (request, resolveContext, callback) => {
      if (request.request[0] !== '/') return callback()
      resolver.doResolve(target, request, null, resolveContext, callback)
    })
  }
}
