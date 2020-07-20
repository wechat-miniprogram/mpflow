import {
  BaseAPI,
  BaseService,
  BaseServiceOptions,
  PluginOption,
  RunnerAPI as IRunnerAPI,
  WeflowConfig,
} from '@weflow/service-core'
import { Configuration } from 'webpack'
import WebpackChain from 'webpack-chain'
import { merge } from 'webpack-merge'
import { Arguments, Argv, CommandModule, InferredOptionTypes, Options } from 'yargs'
import yargs from 'yargs/yargs'

export class RunnerAPI extends BaseAPI<Runner> implements IRunnerAPI<Runner> {
  get mode(): string {
    return this.service.mode
  }

  set mode(mode: string) {
    this.service.mode = mode
  }

  registerCommand<O extends Record<string, Options> = Record<string, Options>>(
    command: CommandModule['command'],
    describe: CommandModule['describe'],
    options: O,
    handler: (args: Arguments<InferredOptionTypes<O>>) => void,
  ): void {
    this.service.registerCommand({
      command,
      describe,
      handler,
      builder: yargs => yargs.options(options),
    })
  }

  configureWebpack(config: (config: WebpackChain) => void): void {
    this.service.webpackConfigs.push(config)
  }

  resolveWebpackConfig(): Configuration {
    return this.service.resolveWebpackConfig()
  }
}

export interface RunnerOptions extends BaseServiceOptions {
  mode?: string
}

export class Runner extends BaseService {
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

  constructor(context: string, { mode, ...options }: RunnerOptions = {}) {
    super(context, options)

    this.program = yargs()
    this.mode = mode || 'development'
  }

  /**
   * 获取所有插件
   * @param inlinePlugins
   * @param config
   */
  resolvePlugins(inlinePlugins: PluginOption[] = [], config: WeflowConfig = this.config): PluginOption[] {
    if (inlinePlugins.length) return inlinePlugins

    const buildInPlugins: PluginOption[] = [
      {
        id: 'built-in:config/base',
        plugin: import('./config/base'),
      },
      {
        id: 'built-in:config/weflow',
        plugin: import('./config/weflow'),
      },
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
    ]

    const projectPlugins = super.resolvePlugins([], config)

    return [...buildInPlugins, ...projectPlugins]
  }

  /**
   * 初始化
   * 加载所有的插件
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    for (const plugin of this.plugins) {
      const { id, plugin: pluginModule } = plugin
      const { default: apply } = await pluginModule
      apply(new RunnerAPI(id, this), this.config)
    }

    if (this.config.configureWebpackChain) {
      this.webpackConfigs.push(this.config.configureWebpackChain)
    }
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
    const chainConfig = config.toConfig()
    const { configureWebpack } = this.config
    const configuredConfig = typeof configureWebpack === 'function' ? configureWebpack(chainConfig) : configureWebpack
    return merge(chainConfig, configuredConfig || {})
  }
}
