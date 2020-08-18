import {
  ConfigureWebpackHandler,
  MpflowConfig,
  Plugin,
  PluginInfo,
  Runner,
  RunnerAPI,
  RunnerOptions,
} from '@mpflow/service-core'
import { Configuration } from 'webpack'
import WebpackChain from 'webpack-chain'
import { merge } from 'webpack-merge'

export class ServiceRunnerAPI extends RunnerAPI<Plugin, ServiceRunner> {
  /**
   * 运行模式
   */
  getMode(): string {
    return this.service.mode
  }

  /**
   * 运行模式
   */
  setMode(mode: string): void {
    this.service.mode = mode
  }

  configureWebpack(handler: ConfigureWebpackHandler): void {
    this.service.configWebpackHandlers.push(handler)
  }

  /**
   * 获取所有的 webpack 配置
   */
  async resolveWebpackConfigs(): Promise<Record<string, Configuration>> {
    return this.service.resolveWebpackConfigs()
  }
}

export interface ServiceRunnerOptions extends RunnerOptions {
  mode?: string
}

export class ServiceRunner extends Runner {
  public configWebpackHandlers: ConfigureWebpackHandler[] = []

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
  static getBuiltInPlugins(): PluginInfo[] {
    return [
      {
        id: '@mpflow/service/lib/config/base',
        module: require('./config/base') as typeof import('./config/base'),
      },
      {
        id: '@mpflow/service/lib/config/mpflow',
        module: require('./config/mpflow') as typeof import('./config/mpflow'),
      },
      {
        id: '@mpflow/service/lib/commands/build',
        module: require('./commands/build') as typeof import('./commands/build'),
      },
      {
        id: '@mpflow/service/lib/commands/dev',
        module: require('./commands/dev') as typeof import('./commands/dev'),
      },
      {
        id: '@mpflow/service/lib/commands/inspect',
        module: require('./commands/inspect') as typeof import('./commands/inspect'),
      },
    ]
  }

  /**
   * 获取所有插件
   * @param inlinePlugins
   * @param config
   */
  resolvePluginInfos(inlinePlugins: PluginInfo[] = [], config: MpflowConfig = this.config): PluginInfo[] {
    const projectPlugins = super.resolvePluginInfos(inlinePlugins, config)
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
      plugin.plugin(new ServiceRunnerAPI(plugin.id, this), this.config, plugin.option)
    })
  }

  /**
   * 执行 CLI
   * @param argv
   */
  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    await this.init()
    await super.run(argv)
  }

  /**
   * 获取所有的 webpack 配置
   */
  async resolveWebpackConfigs(): Promise<Record<string, Configuration>> {
    const webpackConfigs: Map<string, ((config: WebpackChain, id: string) => void)[]> = new Map()
    const { configureWebpack, configureWebpackChain } = this.config
    const configs: Record<string, Configuration> = {}

    /**
     * 设置对应的 webpack 配置
     * @param config
     */
    function configure(config: (config: WebpackChain, id: string) => void): void
    function configure(id: string, config: (config: WebpackChain, id: string) => void): void
    function configure(id: any, config?: any): void {
      if (!config) {
        config = id
        id = undefined
      }
      if (id !== undefined) {
        const webpackConfig = webpackConfigs.get(id)
        if (!webpackConfig) throw new Error(`找不到对应的 webpack 配置 id=${id}`)
        webpackConfig.push(config)
      } else {
        webpackConfigs.forEach(webpackConfig => webpackConfig.push(config))
      }
    }

    /**
     * 添加一个 webpack 构建配置
     * @param id
     * @param config
     */
    function addConfig(id: string, config: (config: WebpackChain, id: string) => void): boolean {
      if (webpackConfigs.has(id)) return false

      webpackConfigs.set(id, [config])
      return true
    }

    /**
     * 判断是否存在 webpack 配置
     */
    function hasConfig(id: string): boolean {
      return webpackConfigs.has(id)
    }

    for (const handler of this.configWebpackHandlers) {
      await handler(
        {
          configure,
          addConfig,
          hasConfig,
        },
        this.mode,
      )
    }

    webpackConfigs.forEach((configurationHandlers, id) => {
      const config = new WebpackChain()

      configurationHandlers.forEach(handler => handler(config, id))

      if (configureWebpackChain) configureWebpackChain(config)

      const chainConfig = config.toConfig()
      const resultConfig =
        typeof configureWebpack === 'function'
          ? configureWebpack(chainConfig)
          : merge(chainConfig, configureWebpack || {})

      configs[id] = resultConfig
    })

    return configs
  }
}
