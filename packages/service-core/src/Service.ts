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

export interface PluginOption {
  id: string
  module?: Plugin
  config?: any
}

export interface BaseServiceOptions {
  plugins?: PluginOption[]
  project?: any
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
   * 工作路径上的 project.config.json 内容
   */
  public project: any

  /**
   * 插件列表
   */
  public pluginOptions: PluginOption[]

  /**
   * weflow.config.js 读取到的配置内容
   */
  public config: WeflowConfig

  constructor(context: string, { plugins, pkg, project, config }: BaseServiceOptions = {}) {
    this.context = context
    this.pkg = this.resolvePkg(pkg, context)
    this.project = this.resolveProject(project, context)
    this.config = this.resolveConfig(config, context)
    this.pluginOptions = this.resolvePluginOptions(plugins)
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
   * 解析 project.config.json
   * @param inlineProject
   * @param context
   */
  resolveProject(inlineProject?: any, context: string = this.context): any {
    if (inlineProject) return inlineProject
    const projectPath = path.resolve(context, 'project.config.json')
    if (fs.existsSync(projectPath)) {
      return JSON.parse(fs.readFileSync(projectPath, 'utf-8'))
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
  resolvePluginOptions(inlinePlugins: PluginOption[] = [], config: WeflowConfig = this.config): PluginOption[] {
    if (inlinePlugins.length) return inlinePlugins

    const projectPlugins: PluginOption[] = (config.plugins || []).map(id => {
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
    pluginOptions: PluginOption[] = this.pluginOptions,
    context: string = this.context,
  ): { id: string; plugin: Plugin; config?: any }[] {
    const interopRequireDefault = <T>(obj: T): T => (obj && (obj as any).__esModule ? (obj as any).default : obj)

    return pluginOptions.map(({ id, module, config }) => {
      let plugin: Plugin = interopRequireDefault(module)!

      if (!plugin) {
        const pluginPath = require.resolve(id, { paths: [context] })
        plugin = interopRequireDefault(require(pluginPath))
      }

      return { id, plugin, config }
    })
  }
}
