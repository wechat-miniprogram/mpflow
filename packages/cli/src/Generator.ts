import { BaseAPI, BaseService, BaseServiceOptions, GeneratorAPI as IGeneratorAPI } from '@weflow/service-core'
import deepMerge from 'deepmerge'
import { Options as EjsOptions } from 'ejs'
import fs from 'fs-extra'
import stableStringify from 'json-stable-stringify'
import path from 'path'
import semver from 'semver'
import { intersect } from 'semver-intersect'
import { renderFiles } from './utils'

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

export class GeneratorAPI extends BaseAPI<Generator> implements IGeneratorAPI<Generator> {
  private depSources: Record<string, string>

  constructor(id: string, service: Generator, depSources: Record<string, string>) {
    super(id, service)
    this.depSources = depSources
  }

  /**
   * 拓展 package.json
   * @param fields
   */
  extendPackage(fields: Record<string, any>): void {
    const pkg = this.service.pkg
    const toMerge = fields

    for (const key in toMerge) {
      const existing = pkg[key]
      const value = toMerge[key]
      if (isObject(value) && (key === 'dependencies' || key === 'devDependencies')) {
        // use special version resolution merge
        pkg[key] = mergeDeps(this.id, existing || {}, value, this.depSources)
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

  async render(source: string, additionalData: Record<string, any> = {}, ejsOptions: EjsOptions = {}): Promise<void> {
    const files = await renderFiles(source, additionalData, ejsOptions)
    Object.assign(this.service.files, files)
  }
}

export interface GeneratorOptions extends BaseServiceOptions {
  depSources?: Record<string, string>
  files?: Record<string, string>
}

export class Generator extends BaseService {
  /**
   * package.json 中依赖的来源
   */
  public depSources: Record<string, string>

  /**
   * 虚拟文件树
   */
  public files: Record<string, string>

  constructor(context: string, { depSources, files, ...options }: GeneratorOptions = {}) {
    super(context, options)

    this.depSources = depSources || {}
    this.files = files || {}
  }

  async generate(): Promise<void> {
    await this.initPlugins()

    this.generatePackage()
    await this.writeFiles()
  }

  /**
   * 执行所有的插件 generator
   */
  async initPlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      const { id, plugin: pluginModule } = plugin
      const { default: apply } = await pluginModule
      if (apply.generator) {
        await apply.generator(new GeneratorAPI(id, this, this.depSources), this.config)
      }
    }
  }

  /**
   * 生成 package.json
   */
  generatePackage(): void {
    this.files['package.json'] = stableStringify(this.pkg, { space: 2 })
  }

  /**
   * 将文件写入磁盘
   */
  async writeFiles(): Promise<void> {
    const names = Object.keys(this.files)
    for (const name of names) {
      const filePath = path.join(this.context, name)
      await fs.mkdirp(path.dirname(filePath))
      await fs.writeFile(filePath, this.files[name])
    }
  }
}
