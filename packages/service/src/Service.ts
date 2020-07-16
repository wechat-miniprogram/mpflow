import fs from 'fs'
import path from 'path'
import WebpackChain from 'webpack-chain'
import { Argv, CommandModule } from 'yargs'
import yargs from 'yargs/yargs'
import { Plugin, PluginAPI } from './PluginAPI'
import { Configuration } from 'webpack'

export interface WeflowConfig {
  plugins?: string[]
  configureWebpack?: (config: WebpackChain) => void
  outputDir?: string
  app?: string | boolean
  pages?: string[]
}

interface PluginOption {
  id: string
  plugin: Promise<{ default: Plugin }>
}

export default class Service {
  /**
   * service 工作路径
   */
  public context: string

  /**
   * 工作路径上的 package.json 内容
   */
  public pkg: any

  /**
   * package.json 中的 dev
   */

  /**
   * 插件列表
   */
  public plugins: PluginOption[]

  /**
   * weflow.config.js 读取到的配置内容
   */
  public config: WeflowConfig

  /**
   * CLI 操作对象
   */
  public program: Argv

  /**
   * webpack 设置
   */
  public webpackConfigs: ((config: WebpackChain) => void)[] = []

  /**
   * 运行模式
   */
  public mode: string

  /**
   * 是否初始化过
   */
  private initialized = false

  constructor(
    context: string,
    { plugins, pkg, config, mode }: { plugins?: PluginOption[]; pkg?: any; config?: WeflowConfig; mode?: string } = {},
  ) {
    this.context = context
    this.pkg = this.resolvePkg(pkg, context)
    this.config = this.resolveConfig(config, context)
    this.plugins = this.resolvePlugins(plugins)
    this.program = yargs()
    this.mode = mode || 'development'
  }

  async init() {
    if (this.initialized) return
    this.initialized = true

    const shared = {}

    for (const plugin of this.plugins) {
      const { id, plugin: pluginModule } = plugin
      const { default: apply } = await pluginModule
      apply(new PluginAPI(id, this, shared), this.config)
    }

    if (this.config.configureWebpack) {
      this.webpackConfigs.push(this.config.configureWebpack)
    }
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
    const buildInPlugins: PluginOption[] = [
      {
        id: 'built-in:command/build',
        plugin: import('./commands/build'),
      },
      {
        id: 'built-in:command/dev',
        plugin: import('./commands/dev'),
      },
      {
        id: 'built-in:command/inspect',
        plugin: import('./commands/inspect'),
      },
      {
        id: 'built-in:config/base',
        plugin: import('./config/base'),
      },
    ]

    const projectPlugins: PluginOption[] = (config.plugins || []).map(id => ({
      id,
      plugin: import(id),
    }))

    return [...buildInPlugins, ...inlinePlugins, ...projectPlugins]
  }

  /**
   * 注册 CLI 命令
   * @param options
   */
  registerCommand<T, U>(options: CommandModule<T, U>): void {
    this.program.command(options)
  }

  /**
   * 执行 CLI
   * @param argv
   */
  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    await this.init()
    this.program.help().parse(argv)
  }

  /**
   * 获取最终 webpack 配置
   */
  resolveWebpackConfig(): Configuration {
    const config = new WebpackChain()
    this.webpackConfigs.forEach(configuration => configuration(config))
    return config.toConfig()
  }
}
