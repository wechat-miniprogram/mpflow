import fs from 'fs'
import path from 'path'
import { Plugin, WeflowConfig } from './type'

export class BaseAPI<S extends BaseService> {
  public id: string
  protected service: S

  constructor(id: string, service: S) {
    this.id = id
    this.service = service
  }

  getCwd(): string {
    return this.service.context
  }

  resolve(_path: string): string {
    return path.resolve(this.service.context, _path)
  }

  hasPlugin(id: string): boolean {
    return this.service.plugins.some(p => p.id === id)
  }
}

export interface PluginOption {
  id: string
  plugin: Promise<{ default: Plugin }>
}

export interface BaseServiceOptions {
  plugins?: PluginOption[]
  pkg?: any
  config?: WeflowConfig
}

export class BaseService {
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
  public plugins: PluginOption[]

  /**
   * weflow.config.js 读取到的配置内容
   */
  public config: WeflowConfig

  constructor(context: string, { plugins, pkg, config }: BaseServiceOptions = {}) {
    this.context = context
    this.pkg = this.resolvePkg(pkg, context)
    this.config = this.resolveConfig(config, context)
    this.plugins = this.resolvePlugins(plugins)
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
   * 解析 weflow.config.js
   * @param inlineConfig
   * @param context
   */
  resolveConfig(inlineConfig?: WeflowConfig, context: string = this.context): WeflowConfig {
    if (inlineConfig) return inlineConfig
    const configPath = path.resolve(context, 'weflow.config.js')
    if (fs.existsSync(configPath)) {
      return require(configPath)
    }
    return {}
  }

  /**
   * 获取所有插件
   * @param inlinePlugins
   * @param config
   */
  resolvePlugins(inlinePlugins: PluginOption[] = [], config: WeflowConfig = this.config): PluginOption[] {
    if (inlinePlugins.length) return inlinePlugins

    const projectPlugins: PluginOption[] = (config.plugins || []).map(id => ({
      id,
      plugin: import(id),
    }))

    return projectPlugins
  }
}
