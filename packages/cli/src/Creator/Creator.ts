import { Plugin, WeflowConfig } from '@weflow/service-core'
import { Generator, GeneratorAPI, GeneratorOptions } from '../Generator'
import { exec } from '../utils'
import { Installer } from '../Installer'

export class CreatorAPI<T extends Creator = Creator> extends GeneratorAPI<T> {
  async exec(command: string, args?: string[]): Promise<void> {
    await exec(this.service.context, command, args)
  }

  async processFiles(handler: (name: string, content: string) => Promise<void>): Promise<void> {
    const { files } = this.service
    for (const name in files) {
      const content = files[name]
      await handler(name, content)
    }
  }

  beforeRender(handler: () => Promise<void>): void {
    this.service.beforeRenderHooks.push(handler)
  }

  afterRender(handler: () => Promise<void>): void {
    this.service.afterRenderHooks.push(handler)
  }

  beforeEmit(handler: () => Promise<void>): void {
    this.service.beforeEmitHooks.push(handler)
  }

  afterEmit(handler: () => Promise<void>): void {
    this.service.afterEmitHooks.push(handler)
  }
}

export interface CreatorPlugin extends Plugin {
  creator: (api: CreatorAPI) => void
}

export interface CreatorPluginOption {
  id: string
  plugin: Promise<{ default: CreatorPlugin }>
}

export interface CreatorOptions extends GeneratorOptions {
  templatePath: string
  projectName: string
  appId: string
}

export class Creator extends Generator {
  /**
   * 模板目录
   */
  public templatePath: string

  /**
   * 项目名称
   */
  public projectName: string

  /**
   * 项目 APP id
   */
  public appId: string

  public plugins: CreatorPluginOption[]

  public beforeRenderHooks: Array<() => Promise<void>> = []
  public afterRenderHooks: Array<() => Promise<void>> = []
  public beforeEmitHooks: Array<() => Promise<void>> = []
  public afterEmitHooks: Array<() => Promise<void>> = []

  constructor(context: string, { templatePath, projectName, appId, ...options }: CreatorOptions) {
    super(context, options)

    this.templatePath = templatePath
    this.projectName = projectName
    this.appId = appId
  }

  async runHooks(hooks: Array<() => Promise<void>>): Promise<void> {
    for (const hook of hooks) {
      await hook()
    }
  }

  async generate(): Promise<void> {
    await this.initPlugins()

    await this.runHooks(this.beforeRenderHooks)

    // 将 template 目录下的内容载入
    await this.render(this.templatePath, {
      projectname: this.projectName,
      appid: this.appId,
    })

    await this.runHooks(this.afterRenderHooks)

    await this.runHooks(this.beforeEmitHooks)

    this.writeFiles()

    await this.runHooks(this.afterEmitHooks)

    const installer = new Installer(this.context, { plugins: ['@weflow/plugin-babel'] })
    await installer.install()
  }

  /**
   * 获取所有插件
   * @param inlinePlugins
   * @param config
   */
  resolvePlugins(inlinePlugins: CreatorPluginOption[] = [], config: WeflowConfig = this.config): CreatorPluginOption[] {
    if (inlinePlugins.length) return inlinePlugins

    const buildInPlugins: CreatorPluginOption[] = [
      {
        id: 'built-in:plugins/installService',
        plugin: import('./plugins/installService'),
      },
    ]

    return buildInPlugins
  }

  /**
   * 执行所有的插件 generator
   */
  async initPlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      const { id, plugin: pluginModule } = plugin
      const { default: apply } = await pluginModule
      if (apply.creator) {
        await apply.creator(new CreatorAPI(id, this, this.depSources))
      }
    }
  }
}
