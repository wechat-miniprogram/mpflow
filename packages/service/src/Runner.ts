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
    this.service.program.command({
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
    const config = new WebpackChain()
    this.service.webpackConfigs.forEach(configuration => configuration(config))
    const chainConfig = config.toConfig()
    const { configureWebpack } = this.service.config
    const configuredConfig = typeof configureWebpack === 'function' ? configureWebpack(chainConfig) : configureWebpack
    return merge(chainConfig, configuredConfig || {})
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
    const builtInPlugins = Runner.getBuiltInPlugins()

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
      plugin.plugin(new RunnerAPI(plugin.id, this), this.config)
    })

    if (this.config.configureWebpackChain) {
      this.webpackConfigs.push(this.config.configureWebpackChain)
    }
  }

  /**
   * 执行 CLI
   * @param argv
   */
  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    await this.init()
    this.program.help().demandCommand().parse(argv)
  }
}
