import {
  BaseAPI,
  BaseService,
  BaseServiceOptions,
  GeneratorAPI as IGeneratorAPI,
  ProcessFileHandler,
} from '@weflow/service-core'
import { Options as EjsOptions } from 'ejs'
import minimatch from 'minimatch'
import { loadFiles, mergePackage, removeFiles, renderFiles, stringifyPackage, writeFiles } from './utils'

export class GeneratorAPI<T extends Generator = Generator> extends BaseAPI<T> implements IGeneratorAPI<T> {
  private depSources: Record<string, string>

  constructor(id: string, service: T, depSources: Record<string, string>) {
    super(id, service)
    this.depSources = depSources
  }

  /**
   * 拓展 package.json
   * @param toMerge
   */
  extendPackage(toMerge: Record<string, any>): void {
    mergePackage(this.service.pkg, toMerge, this.id, this.depSources)
  }

  render(source: string, additionalData: Record<string, any> = {}, ejsOptions: EjsOptions = {}): void {
    return this.service.render(source, additionalData, ejsOptions)
  }

  processFile(handler: ProcessFileHandler): void
  processFile(filter: string, handler: ProcessFileHandler): void
  processFile(filter: any, handler?: any): void {
    this.service.processFile(filter, handler)
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

  /**
   * 需要删除的文件列表
   */
  public filesToRemove: Set<string>

  /**
   * 处理文件回调
   */
  public processFilesHandlers: { filter?: string; handler: ProcessFileHandler }[]

  constructor(context: string, { depSources, files, ...options }: GeneratorOptions = {}) {
    super(context, options)

    this.depSources = depSources || {}
    this.files = this.loadFiles(files)
    this.processFilesHandlers = []
    this.filesToRemove = new Set()
  }

  /**
   * 加载 context 下的文件内容
   */
  loadFiles(innerFiles: Record<string, string> = {}): Record<string, string> {
    return {
      ...loadFiles(this.context),
      ...innerFiles,
    }
  }

  async generate(): Promise<void> {
    await this.initPlugins()

    this.generatePackage()
    this.doProcessFiles()
    await this.writeFiles()
    await this.removeFiles()
  }

  /**
   * 执行所有的插件 generator
   */
  async initPlugins(): Promise<void> {
    const plugins = this.resolvePlugins()

    plugins.forEach(({ id, plugin }) => {
      plugin.generator && plugin.generator(new GeneratorAPI(id, this, this.depSources), this.config)
    })
  }

  /**
   * 生成 package.json
   */
  generatePackage(): void {
    this.files['package.json'] = stringifyPackage(this.pkg)
  }

  /**
   * 将一个目录渲染到虚拟树中
   */
  render(source: string, additionalData: Record<string, any> = {}, ejsOptions: EjsOptions = {}): void {
    const files = renderFiles(source, additionalData, ejsOptions)
    Object.assign(this.files, files)
  }

  /**
   * 将文件写入磁盘
   */
  async writeFiles(): Promise<void> {
    await writeFiles(this.context, this.files)
  }

  /**
   * 删除多余文件
   */
  async removeFiles(): Promise<void> {
    removeFiles(this.context, this.filesToRemove)
  }

  /**
   * 注册文件处理回调
   * @param handler
   */
  processFile(handler: ProcessFileHandler): void
  processFile(filter: string, handler: ProcessFileHandler): void
  processFile(filter: ProcessFileHandler | string, handler?: ProcessFileHandler): void {
    const { processFilesHandlers } = this
    if (!handler) {
      processFilesHandlers.push({
        filter: '',
        handler: filter as ProcessFileHandler,
      })
    } else {
      processFilesHandlers.push({
        filter: filter as string,
        handler,
      })
    }
  }

  /**
   * 处理文件内容
   */
  doProcessFiles(): void {
    for (const originFilePath in this.files) {
      let outFilePath = originFilePath
      let outFileContent = this.files[originFilePath]

      this.processFilesHandlers.forEach(({ filter, handler }) => {
        if (filter && !minimatch(outFilePath, filter)) return
        handler(
          {
            path: outFilePath,
            source: outFileContent,
          },
          {
            rename: name => {
              outFilePath = name
            },
            replace: content => {
              outFileContent = content
            },
          },
        )
      })

      this.files[outFilePath] = outFileContent
      if (outFilePath !== originFilePath) {
        this.filesToRemove.delete(outFilePath)
        this.filesToRemove.add(originFilePath)
        delete this.files[originFilePath]
      }
    }
  }
}
