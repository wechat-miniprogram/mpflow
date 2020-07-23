import { BaseAPI, BaseService, BaseServiceOptions, Plugin, PluginOption, WeflowConfig } from '@weflow/service-core'
import { Arguments, Argv, CommandModule, InferredOptionTypes, Options, PositionalOptions } from 'yargs'
import yargs from 'yargs/yargs'
import { Creator } from './Creator'

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
      handler: args => {
        handler(args as any)
      },
      builder: yargs => {
        Object.keys(positional).forEach(key => (yargs = yargs.positional(key, positional[key])))
        yargs = yargs.options(options)
        return yargs
      },
    })
  }

  /**
   * 新建项目，并且安装内置插件
   */
  async create(
    context: string,
    templatePath: string,
    { projectName, appId }: { projectName: string; appId: string },
  ): Promise<void> {
    const creator = new Creator(context, {
      templatePath,
      projectName,
      appId,
    })

    await creator.generate()
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
  public pluginOptions: CliPluginOption[]

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
  resolvePluginOptions(inlinePlugins: PluginOption[] = []): PluginOption[] {
    const buildInPlugins: PluginOption[] = [
      {
        id: '@weflow/cli/lib/commands/create',
        module: require('./commands/create'),
      },
    ]

    return [...buildInPlugins, ...inlinePlugins]
  }

  resolvePlugins(
    pluginOptions: PluginOption[] = this.pluginOptions,
    context: string = this.context,
  ): { id: string; plugin: CliPlugin; config?: any }[] {
    return super.resolvePlugins(pluginOptions, context)
  }

  /**
   * 初始化
   * 加载所有的插件
   */
  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const plugins = this.resolvePlugins()

    plugins.forEach(({ id, plugin }) => {
      plugin.cliRunner && plugin.cliRunner(new CliRunnerAPI(id, this), this.config)
    })
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
