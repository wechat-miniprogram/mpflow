import fs from 'fs'
import path from 'path'
import { Plugin, MpflowConfig } from './type'

export class BaseAPI<P = Plugin, S extends BaseService<P> = BaseService<P>> {
  public id: string
  protected service: S

  constructor(id: string, service: S) {
    this.id = id
    this.service = service
  }

  getProjectName(): string {
    return this.service.pkg.name || ''
  }

  getCwd(): string {
    return this.service.context
  }

  resolve(...paths: string[]): string {
    return path.resolve(this.service.context, ...paths)
  }

  hasPlugin(id: string): boolean {
    return this.service.pluginOptions.some(p => p.id === id)
  }
}

export interface PluginInfo<P = Plugin> {
  id: string
  module?: P
  config?: any
}

export interface BaseServiceOptions {
  plugins?: PluginInfo<any>[]
  pkg?: any
  config?: MpflowConfig
}

export abstract class BaseService<P = Plugin> {
  /**
   * service 工作路径
   */
  public context: string

  /**
   * 工作路径上的 package.json 内容
   */
  public pkg: any

  /**
   * 插件列表
   */
  public pluginOptions: PluginInfo<P>[]

  /**
   * mpflow.config.js 读取到的配置内容
   */
  public config: MpflowConfig

  constructor(context: string, { plugins, pkg, config }: BaseServiceOptions = {}) {
    this.context = context
    this.pkg = this.resolvePkg(pkg, context)
    this.config = this.resolveConfig(config, context)
    this.pluginOptions = this.resolvePluginInfos(plugins)
  }

  /**
   * 解析 package.json
   * @param inlinePkg
   * @param context
   */
  resolvePkg(inlinePkg?: any, context: string = this.context): any {
    if (inlinePkg) return inlinePkg
    const pkgPath = path.resolve(context, 'package.json')
    if (fs.existsSync(pkgPath)) {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    }
    return {}
  }

  /**
   * 解析 mpflow.config.js
   * @param inlineConfig
   * @param context
   */
  resolveConfig(inlineConfig?: MpflowConfig, context: string = this.context): MpflowConfig {
    if (inlineConfig) return inlineConfig
    const configPath = path.resolve(context, 'mpflow.config.js')
    if (fs.existsSync(configPath)) {
      delete require.cache[configPath]
      return require(configPath)
    }
    return {}
  }

  /**
   * 获取所有插件配置
   * @param inlinePlugins
   * @param config
   */
  resolvePluginInfos(inlinePlugins: PluginInfo<P>[] = [], config: MpflowConfig = this.config): PluginInfo<P>[] {
    if (inlinePlugins.length) return inlinePlugins

    const projectPlugins: PluginInfo<P>[] = (config.plugins || []).map(id => {
      return {
        id,
      }
    })

    return projectPlugins
  }

  /**
   * 获取所有插件
   */
  resolvePlugins(
    pluginOptions: PluginInfo<P>[] = this.pluginOptions,
    context: string = this.context,
  ): { id: string; plugin: P; config?: any }[] {
    const interopRequireDefault = <T>(obj: T): T => (obj && (obj as any).__esModule ? (obj as any).default : obj)

    return pluginOptions.map(({ id, module, config }) => {
      let plugin: P = interopRequireDefault(module)!

      if (!plugin) {
        const pluginPath = require.resolve(id, { paths: [context] })
        plugin = interopRequireDefault(require(pluginPath))
      }

      return { id, plugin, config }
    })
  }
}
