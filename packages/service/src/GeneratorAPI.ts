import semver from 'semver'
import { intersect } from 'semver-intersect'
import { BaseAPI } from './PluginAPI'
import Service from './Service'
import deepMerge from 'deepmerge'

const isObject = (obj: any) => typeof obj === 'object'

const mergeDeps = (
  id: string,
  sourceDeps: Record<string, string>,
  depsToInject: Record<string, string>,
  depSources: Record<string, string>,
): Record<string, string> => {
  const result = { ...sourceDeps }

  for (const depName in depsToInject) {
    const sourceRange = sourceDeps[depName]
    const injectingRange = depsToInject[depName]

    if (sourceRange === injectingRange) continue

    if (!semver.validRange(injectingRange)) {
      console.warn(`invalid semver "${depName}": "${injectingRange}" in ${id}`)
      continue
    }

    const sourceGeneratorId = depSources[depName]

    if (sourceRange) {
      if (!semver.intersects(sourceRange, injectingRange)) {
        console.warn(
          `semver "${depName}": "${sourceRange}"${
            sourceGeneratorId ? `(from ${sourceGeneratorId})` : ''
          } and "${depName}": "${injectingRange}"(from ${id}) are not intersect`,
        )
        continue
      }
      if (semver.subset(sourceRange, injectingRange)) continue
      result[depName] = intersect(sourceRange, injectingRange)
      depSources[depName] = id
    } else {
      result[depName] = injectingRange
      depSources[depName] = id
    }
  }

  return result
}

const mergeArrayWithDedupe = <A, B>(a: A[], b: B[]) => [...new Set([...a, ...b])]

export class GeneratorAPI extends BaseAPI<{ depSources: Record<string, string> }> {
  constructor(id: string, service: Service, shared: Partial<{ depSources: Record<string, string> }>) {
    super(id, service, shared)
    this.shared.depSources = this.shared.depSources || {}
  }

  extendPackage(fields: any) {
    const pkg = this.service.pkg
    const toMerge = fields

    for (const key in toMerge) {
      const existing = pkg[key]
      const value = toMerge[key]
      if (isObject(value) && (key === 'dependencies' || key === 'devDependencies')) {
        // use special version resolution merge
        pkg[key] = mergeDeps(this.id, existing || {}, value, this.shared.depSources!)
      } else if (!(key in pkg)) {
        pkg[key] = value
      } else if (Array.isArray(value) && Array.isArray(existing)) {
        pkg[key] = mergeArrayWithDedupe(existing, value)
      } else if (isObject(value) && isObject(existing)) {
        pkg[key] = deepMerge(existing, value, { arrayMerge: mergeArrayWithDedupe })
      } else {
        pkg[key] = value
      }
    }
  }
}
