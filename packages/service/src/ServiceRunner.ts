import { PluginOption, Runner, RunnerAPI, RunnerOptions, WeflowConfig } from '@weflow/service-core'
import { Configuration } from 'webpack'
import WebpackChain from 'webpack-chain'
import { merge } from 'webpack-merge'

export class ServiceRunnerAPI extends RunnerAPI<ServiceRunner> {
  /**
   * 运行模式
   */
  get mode(): string {
    return this.service.mode
  }

  /**
   * 运行模式
   */
  set mode(mode: string) {
    this.service.mode = mode
  }

  beforeConfigureWebpack(handler: () => void): void {
    this.service.configWebpackHandlers.push(handler)
  }

  /**
   * 设置对应的 webpack 配置
   * @param config
   */
  configureWebpack(config: (config: WebpackChain, id: string) => void): void
  configureWebpack(id: string, config: (config: WebpackChain, id: string) => void): void
  configureWebpack(id: any, config?: any): void {
    if (!config) {
      config = id
      id = undefined
    }
    if (id !== undefined) {
      const webpackConfigs = this.service.webpackConfigs.get(id)
      if (!webpackConfigs) throw new Error(`找不到对应的 webpack 配置 id=${id}`)
      webpackConfigs.push(config)
    } else {
      this.service.webpackConfigs.forEach(webpackConfigs => webpackConfigs.push(config))
    }
  }

  /**
   * 获取所有的 webpack 配置
   */
  async resolveWebpackConfigs(): Promise<Configuration[]> {
    const { configureWebpack, configureWebpackChain } = this.service.config
    const configs: Configuration[] = []

    for (const handler of this.service.configWebpackHandlers) {
      await handler()
    }

    this.service.webpackConfigs.forEach((configurationHandlers, id) => {
      const config = new WebpackChain()

      configurationHandlers.forEach(handler => handler(config, id))

      if (configureWebpackChain) configureWebpackChain(config)

      const chainConfig = config.toConfig()
      const resultConfig =
        typeof configureWebpack === 'function'
          ? configureWebpack(chainConfig)
          : merge(chainConfig, configureWebpack || {})

      configs.push(resultConfig)
    })

    return configs
  }

  /**
   * 添加一个 webpack 构建配置
   * @param id
   * @param config
   */
  addWebpackConfig(id: string, config: (config: WebpackChain, id: string) => void): boolean {
    const webpackConfigs = this.service.webpackConfigs
    if (webpackConfigs.has(id)) return false

    webpackConfigs.set(id, [config])
    return true
  }

  /**
   * 是否有 webpack 构建配置
   */
  hasWebpackConfig(id: string): boolean {
    return this.service.webpackConfigs.has(id)
  }
}

export interface ServiceRunnerOptions extends RunnerOptions {
  mode?: string
}

export class ServiceRunner extends Runner {
  /**
   * webpack 设置
   */
  public webpackConfigs: Map<string, ((config: WebpackChain, id: string) => void)[]> = new Map()

  public configWebpackHandlers: (() => void)[] = []

  /**
   * 运行模式
   */
  public mode: string

  /**
   * 是否初始化过
   */
  private initialized = false

  constructor(context: string, { mode, ...options }: ServiceRunnerOptions = {}) {
    super(context, options)

    this.mode = mode || 'development'
  }

  /**
   * 获取内置组件列表
   */
  static getBuiltInPlugins(): PluginOption[] {
    return [
      {
        id: '@weflow/service/lib/config/base',
        module: require('./config/base'),
      },
      {
        id: '@weflow/service/lib/config/weflow',
        module: require('./config/weflow'),
      },
      {
        id: '@weflow/service/lib/commands/build',
        module: require('./commands/build'),
      },
      {
        id: '@weflow/service/lib/commands/dev',
        module: require('./commands/dev'),
      },
      {
        id: '@weflow/service/lib/commands/inspect',
        module: require('./commands/inspect'),
      },
    ]
  }

  /**
   * 获取所有插件
   * @param inlinePlugins
   * @param config
   */
  resolvePluginOptions(inlinePlugins: PluginOption[] = [], config: WeflowConfig = this.config): PluginOption[] {
    const projectPlugins = super.resolvePluginOptions(inlinePlugins, config)
    const builtInPlugins = ServiceRunner.getBuiltInPlugins()

    return [...builtInPlugins, ...projectPlugins]
  }

  /**
   * 初始化
   * 加载所有的插件
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const plugins = this.resolvePlugins()

    plugins.forEach(plugin => {
      plugin.plugin(new ServiceRunnerAPI(plugin.id, this), this.config)
    })
  }

  /**
   * 执行 CLI
   * @param argv
   */
  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    await this.init()
    super.run(argv)
  }
}
