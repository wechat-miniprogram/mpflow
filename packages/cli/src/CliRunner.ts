import { BaseRunnerAPI, MpflowConfig, PluginInfo, Runner, RunnerOptions } from '@mpflow/service-core'
import { Creator } from './Creator'
import { Generator } from './Generator'
import { checkForUpdates, shouldCheckForUpdates } from './update'
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

    await creator.create()
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
   * 触发插件 generator
   * @param command
   * @param description
   */
  async generate(context: string, pluginNames: string[]): Promise<void> {
    const generator = new Generator(context, { plugins: pluginNames.map(id => ({ id })) })

    await generator.generate(false)
  }

  /**
   * 将命令在 pwd 所在的 service 上执行
   * @param command
   */
  proxyCommand(command: string, description: string): void {
    this.service.proxyCommand(command, description)
  }
}

export interface CliRunnerOptions extends RunnerOptions {}

export interface CliPlugin {
  (api: CliRunnerAPI, config: MpflowConfig): void
}

export interface CliPluginInfo extends PluginInfo<CliPlugin> {}

export class CliRunner extends Runner<CliPlugin> {
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
        id: '@mpflow/cli/lib/commands/generate',
        module: require('./commands/generate'),
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
    const isTest = process.env.NODE_ENV === 'test'

    await this.init()
    await super.run(argv)

    // 每次执行后尝试检查更新
    if (!isTest && shouldCheckForUpdates(this.context)) {
      await checkForUpdates(this.inputFileSystem, this.context, this.pkg)
    }
  }

  /**
   * 将命令在 pwd 所在的 service 上执行
   * @param command
   */
  proxyCommand(command: string, description: string): void {
    this._registerCommand(
      command,
      description,
      yargs => {
        yargs.help(false).version(false)
        return yargs
      },
      async () => {
        const { ServiceRunner } = getLocalService(this.context)
        const serviceRunner = new ServiceRunner(this.context)
        await serviceRunner.run(process.argv.slice(2))
      },
    )
  }
}
