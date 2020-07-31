import { BaseRunnerAPI, Plugin, PluginOption, Runner, RunnerOptions, WeflowConfig } from '@weflow/service-core'
import { Creator } from './Creator'

export class CliRunnerAPI extends BaseRunnerAPI<CliRunner> {
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

export interface CliRunnerOptions extends RunnerOptions {}

export interface CliPlugin extends Plugin {
  cliRunner?: (api: CliRunnerAPI, config: WeflowConfig) => void
}

export interface CliPluginOption extends PluginOption {
  plugin: Promise<{ default: CliPlugin }>
}

export class CliRunner extends Runner {
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
   * 执行 CLI
   * @param argv
   */
  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    await this.init()
    super.run(argv)
  }
}
