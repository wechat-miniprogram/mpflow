import { BaseRunnerAPI, PluginInfo, Runner, RunnerOptions, MpflowConfig } from '@mpflow/service-core'
import { Creator } from './Creator'
import { getLocalService } from './utils'

export class CliRunnerAPI extends BaseRunnerAPI<CliPlugin, CliRunner> {
  /**
   * 新建项目，并且安装内置插件
   */
  async create(
    context: string,
    templateName: string,
    { projectName, appId }: { projectName: string; appId: string },
  ): Promise<void> {
    const creator = new Creator(context, {
      templateName,
      projectName,
      appId,
    })

    await creator.generate()
  }

  /**
   * 为项目安装插件
   * @param context
   * @param pluginNames
   */
  async add(context: string, pluginNames: string[]): Promise<void> {
    const creator = new Creator(context, {})

    await creator.installPlugin(pluginNames)
  }

  /**
   * 将命令在 pwd 所在的 service 上执行
   * @param command
   */
  proxyCommand(command: string, description: string): void {
    this.service.program.command(
      command,
      description,
      yargs => {
        yargs.help(false).version(false)
      },
      async () => {
        const { ServiceRunner } = getLocalService(this.service.context)
        const serviceRunner = new ServiceRunner(this.service.context)
        await serviceRunner.run(process.argv.slice(2))
      },
    )
  }
}

export interface CliRunnerOptions extends RunnerOptions {}

export interface CliPlugin {
  (api: CliRunnerAPI, config: MpflowConfig): void
}

export interface CliPluginInfo extends PluginInfo<CliPlugin> {}

export class CliRunner extends Runner<CliPlugin> {
  /**
   * 插件列表
   */
  public pluginOptions: CliPluginInfo[]

  /**
   * 是否初始化过
   */
  private initialized = false

  constructor(context: string, options: CliRunnerOptions = {}) {
    super(context, options)
  }

  /**
   * 获取所有插件
   * @param inlinePlugins
   * @param config
   */
  resolvePluginInfos(inlinePlugins: PluginInfo<CliPlugin>[] = []): PluginInfo<CliPlugin>[] {
    const buildInPlugins: PluginInfo<CliPlugin>[] = [
      {
        id: '@mpflow/cli/lib/commands/create',
        module: require('./commands/create'),
      },
      {
        id: '@mpflow/cli/lib/commands/add',
        module: require('./commands/add'),
      },
      {
        id: '@mpflow/cli/lib/commands/proxy',
        module: require('./commands/proxy'),
      },
    ]

    return [...buildInPlugins, ...inlinePlugins]
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
      plugin && plugin(new CliRunnerAPI(id, this), this.config)
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
