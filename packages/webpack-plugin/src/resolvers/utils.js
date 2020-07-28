function withStage(stage, hook) {
  const currentStage = (hook._withOptions || {}).stage || 0
  const resultStage = currentStage + stage

  const options = Object.assign({}, hook._withOptions || {}, { stage: resultStage })

  const mergeOptions = opt => Object.assign({}, options, typeof opt === 'string' ? { name: opt } : opt)

  const base = hook._withOptionsBase || hook
  const newHook = Object.create(base)

  newHook.tapAsync = (opt, fn) => base.tapAsync(mergeOptions(opt), fn)
  newHook.tap = (opt, fn) => base.tap(mergeOptions(opt), fn)
  newHook.tapPromise = (opt, fn) => base.tapPromise(mergeOptions(opt), fn)
  newHook._withOptions = options
  newHook._withOptionsBase = base
  return newHook
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, str => str.substr(1).toUpperCase())
}

export function ensureHook(resolver, name) {
  if (typeof name !== 'string') return name
  name = toCamelCase(name)
  if (/^before/i.test(name)) {
    return withStage(-10, ensureHook(resolver, name[6].toLowerCase() + name.substr(7)))
  }
  if (/^after/i.test(name)) {
    return withStage(10, ensureHook(resolver, name[5].toLowerCase() + name.substr(6)))
  }
  return resolver.ensureHook(name)
}

export function getHook(resolver, name) {
  if (typeof name !== 'string') return name
  name = toCamelCase(name)
  if (/^before/i.test(name)) {
    return withStage(-10, getHook(resolver, name[6].toLowerCase() + name.substr(7)))
  }
  if (/^after/i.test(name)) {
    return withStage(10, getHook(resolver, name[5].toLowerCase() + name.substr(6)))
  }
  return resolver.getHook(name)
}
