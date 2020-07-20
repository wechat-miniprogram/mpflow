import { BaseAPI, BaseService, BaseServiceOptions, Plugin, PluginOption, WeflowConfig } from '@weflow/service-core'
import { Arguments, Argv, CommandModule, InferredOptionTypes, Options, PositionalOptions } from 'yargs'
import yargs from 'yargs/yargs'
import { Generator, GeneratorOptions } from './Generator'

export class CliRunnerAPI extends BaseAPI<CliRunner> {
  registerCommand<
    P extends Record<string, PositionalOptions> = Record<string, PositionalOptions>,
    O extends Record<string, Options> = Record<string, Options>
  >(
    command: CommandModule['command'],
    describe: CommandModule['describe'],
    positional: P,
    options: O,
    handler: (args: Arguments<InferredOptionTypes<P> & InferredOptionTypes<O>>) => void,
  ): void {
    this.service.registerCommand({
      command,
      describe,
      handler,
      builder: yargs => {
        Object.keys(positional).forEach(key => (yargs = yargs.positional(key, positional[key])))
        yargs = yargs.options(options)
        return yargs
      },
    })
  }

  async callGenerator(context: string, options: GeneratorOptions): Promise<void> {
    const generator = new Generator(context, options)

    try {
      await generator.generate()
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

export interface CliRunnerOptions extends BaseServiceOptions {}

export interface CliPlugin extends Plugin {
  cliRunner?: (api: CliRunnerAPI, config: WeflowConfig) => void
}

export interface CliPluginOption extends PluginOption {
  plugin: Promise<{ default: CliPlugin }>
}

export class CliRunner extends BaseService {
  /**
   * CLI 操作对象
   */
  public program: Argv

  /**
   * 插件列表
   */
  public plugins: CliPluginOption[]

  /**
   * 是否初始化过
   */
  private initialized = false

  constructor(context: string, options: CliRunnerOptions = {}) {
    super(context, options)

    this.program = yargs()
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
        id: 'built-in:commands/create',
        plugin: import('./commands/create'),
      },
    ]

    return buildInPlugins
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
      apply.cliRunner && apply.cliRunner(new CliRunnerAPI(id, this), this.config)
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
}
