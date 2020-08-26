import {
  BaseAPI,
  BaseService,
  BaseServiceOptions,
  GeneratorAPI as IGeneratorAPI,
  Plugin,
  ProcessFileAPI,
  ProcessFileHandler,
  ProcessFileInfo,
} from '@mpflow/service-core'
import { Options as EjsOptions } from 'ejs'
import micromatch from 'micromatch'
import path from 'path'
import { AsyncSeriesHook, AsyncSeriesWaterfallHook } from 'tapable'
import {
  installNodeModules,
  loadFiles,
  mergePackage,
  renderFile,
  renderFiles,
  stringifyPackage,
  syncFiles,
} from './utils'

export class GeneratorAPI<P extends Plugin = Plugin, S extends Generator<P> = Generator<P>> extends BaseAPI<P, S>
  implements IGeneratorAPI<P, S> {
  constructor(id: string, service: S) {
    super(id, service)
  }

  /**
   * 拓展 package.json
   * @param toMerge
   */
  extendPackage(toMerge: Record<string, any>): void {
    this.service.extendPackage(toMerge, this.id)
  }

  renderDir(
    source: string,
    targetPath?: string,
    options?: {
      pattern?: string
      additionalData?: Record<string, any>
      ejsOptions?: EjsOptions
    },
  ): void {
    return this.service.renderDir(source, targetPath, options)
  }

  renderFile(
    source: string,
    targetPath: string,
    options?: {
      additionalData?: Record<string, any>
      ejsOptions?: EjsOptions
    },
  ): void {
    return this.service.renderFile(source, targetPath, options)
  }

  processFile(handler: ProcessFileHandler): void
  processFile(filter: string | string[], handler: ProcessFileHandler): void
  processFile(filter: any, handler?: any): void {
    this.service.processFile(this.id, filter, handler)
  }
}

export interface GeneratorOptions extends BaseServiceOptions {
  depSources?: Record<string, string>
  files?: Record<string, string>
}

export class Generator<P extends Plugin = Plugin> extends BaseService<P> {
  /**
   * package.json 中依赖的来源
   */
  public depSources: Record<string, string>

  /**
   * 生成文件任务队列
   */
  public renderTaskQueue: (() => Promise<Record<string, string>>)[]

  /**
   *
   */
  public hooks = {
    /**
     * 加载阶段，加载文件系统中的文件
     */
    load: new AsyncSeriesHook<string, ProcessFileInfo[]>(['context', 'queue']),
    /**
     * 生成阶段
     */
    generate: new AsyncSeriesHook<Record<string, string>, (() => Promise<Record<string, string>>)[], ProcessFileInfo[]>(
      ['files', 'renderQueue', 'processQueue'],
    ),
    /**
     * 处理阶段，根据已有文件进行对应处理
     */
    process: new AsyncSeriesWaterfallHook<ProcessFileInfo | null, never, never>(['info']),
    /**
     * 写入阶段，将新生成的或处理后的文件写入文件系统
     */
    write: new AsyncSeriesHook<Record<string, string>>(['files']),
  }

  constructor(context: string, { depSources, files: innerFiles, ...options }: GeneratorOptions = {}) {
    super(context, options)

    this.depSources = depSources || {}

    this.hooks.load.tapPromise('generator', async (context, queue) => {
      const files = {
        ...loadFiles(this.inputFileSystem, context),
        ...(innerFiles || {}),
      }

      Object.keys(files).forEach(path => queue.push({ path, source: files[path] }))
    })

    this.hooks.generate.tapPromise('generator', async (files, renderQueue, processQueue) => {
      do {
        while (renderQueue.length) {
          const renderTask = renderQueue.shift()!
          const files = await renderTask()
          Object.keys(files).forEach(path => processQueue.push({ path, source: files[path] }))
        }
        while (processQueue.length) {
          const fileInfo = processQueue.shift()
          const processedFileInfo = await this.hooks.process.promise(fileInfo)

          if (processedFileInfo) {
            const { path, source } = processedFileInfo
            files[path] = source
          }
        }
      } while (renderQueue.length || processQueue.length)
    })

    // 默认对 package.json 做处理
    this.hooks.process.tap('generator', fileInfo => {
      if (fileInfo && fileInfo.path === 'package.json') {
        fileInfo.source = stringifyPackage(this.pkg)
      }
      return fileInfo
    })

    // 同步到文件系统
    this.hooks.write.tapPromise('generator', async files => {
      await syncFiles(this.outputFileSystem, this.context, files)
    })
  }

  /**
   * 触发 generator
   * @param installModules
   */
  async generate(installModules = false): Promise<void> {
    const processFileQueue: ProcessFileInfo[] = []
    const files: Record<string, string> = {}
    this.renderTaskQueue = []

    await this.initPlugins()

    await this.hooks.load.promise(this.context, processFileQueue)
    await this.hooks.generate.promise(files, this.renderTaskQueue, processFileQueue)

    await this.hooks.write.promise(files)

    if (installModules) await installNodeModules(this.context)
  }

  /**
   * 执行所有的插件 generator
   */
  async initPlugins(): Promise<void> {
    const plugins = this.resolvePlugins()

    plugins.forEach(({ id, plugin, option }) => {
      plugin.generator && plugin.generator(new GeneratorAPI<P>(id, this), this.config, option)
    })
  }

  extendPackage(toMerge: Record<string, any>, id: string): void {
    return mergePackage(this.pkg, toMerge, id, this.depSources)
  }

  /**
   * 将一个目录渲染到虚拟树中
   */
  renderDir(
    source: string,
    targetPath = '',
    options: { pattern?: string; additionalData?: Record<string, any>; ejsOptions?: EjsOptions } = {},
  ): void {
    this.renderTaskQueue.push(async () => {
      const { pattern, additionalData, ejsOptions } = {
        pattern: '**/*',
        additionalData: {},
        ejsOptions: {},
        ...options,
      }
      const files = renderFiles(this.inputFileSystem, source, pattern, additionalData, ejsOptions)

      for (const originFilePath in files) {
        const filePath = path.join(targetPath, originFilePath)
        if (originFilePath !== filePath) {
          files[filePath] = files[originFilePath]
          delete files[originFilePath]
        }
      }

      return files
    })
  }
  /**
   * 将一个目录渲染到虚拟树中
   */
  renderFile(
    source: string,
    targetPath: string,
    options: { additionalData?: Record<string, any>; ejsOptions?: EjsOptions } = {},
  ): void {
    this.renderTaskQueue.push(async () => {
      const { additionalData, ejsOptions } = {
        additionalData: {},
        ejsOptions: {},
        ...options,
      }
      const fileContent = renderFile(this.inputFileSystem, source, additionalData, ejsOptions)

      return {
        [targetPath]: fileContent,
      }
    })
  }

  /**
   * 注册文件处理回调
   * @param handler
   */
  processFile(id: string, handler: ProcessFileHandler): void
  processFile(id: string, filter: string | string[], handler: ProcessFileHandler): void
  processFile(id: string, a: ProcessFileHandler | string | string[], b?: ProcessFileHandler): void {
    const filter = b ? (a as string | string[]) : undefined
    const handler = b ? (b as ProcessFileHandler) : (a as ProcessFileHandler)

    this.hooks.process.tapPromise(id, async fileInfo => {
      if (!fileInfo) return null
      if (filter && !micromatch.all(fileInfo.path, filter)) return fileInfo
      let removed = false

      const processFileAPI: ProcessFileAPI = {
        rename: name => {
          fileInfo.path = name
        },
        replace: content => {
          fileInfo.source = content
        },
        remove: (remove = true) => {
          removed = remove
        },
        transform: (transform, options) => {
          const jscodeshift = require('jscodeshift') as typeof import('jscodeshift')
          // const j = jscodeshift.withParser('ts')
          const j = jscodeshift

          const out = transform(
            fileInfo,
            {
              j,
              jscodeshift: j,
              report: () => {},
              stats: () => {},
            },
            options,
          )

          if (out) fileInfo.source = out
        },
      }

      handler(fileInfo, processFileAPI)

      if (removed) return null // 提前结束 process hook, 阻止继续执行
      return fileInfo
    })
  }
}
