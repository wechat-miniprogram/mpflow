import { Plugin, PluginOption } from '@weflow/service-core'
import { Generator, GeneratorAPI, GeneratorOptions } from './Generator'
import { exec, getLocalService } from './utils'

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
  creator?: (api: CreatorAPI) => void
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
      projectName: this.projectName,
      appId: this.appId,
    })

    await this.runHooks(this.afterRenderHooks)

    await this.runHooks(this.beforeEmitHooks)

    this.writeFiles()

    await this.runHooks(this.afterEmitHooks)

    await this.install(['@weflow/plugin-babel', '@weflow/plugin-typescript', '@weflow/plugin-css'], true)
  }

  /**
   * 获取本地安装的 @weflow/service
   * @param context
   */
  getLocalService(context: string = this.context): typeof import('@weflow/service') {
    let localService: typeof import('@weflow/service')
    try {
      localService = getLocalService(context)
    } catch (e) {
      throw new Error('当前路径下无法找到 @weflow/service')
    }
    return localService
  }

  async install(pluginNames: string[], generateBuiltIns = false): Promise<void> {
    const localService = this.getLocalService(this.context)
    await exec(this.context, 'yarn', ['install'])

    if (pluginNames.length) {
      await exec(this.context, 'yarn', ['link', ...pluginNames])
    }

    if (generateBuiltIns || pluginNames.length) {
      // 执行 generator 从而执行插件的 generator
      let plugins: PluginOption[] = pluginNames.map(id => ({ id }))

      if (generateBuiltIns) {
        plugins = [...localService.Runner.getBuiltInPlugins(), ...plugins]
      }

      const generator = new Generator(this.context, { plugins })

      // 将插件添加到 weflow.config.js
      generator.processFile('weflow.config.js', (file, api) => {
        api.transform(require('@weflow/service-core/lib/codemods/add-to-exports').default, {
          fieldName: 'plugins',
          items: pluginNames,
        })
      })

      await generator.generate()

      await exec(this.context, 'yarn', ['install'])
    }
  }

  /**
   * 获取所有插件
   * @param inlinePlugins
   * @param config
   */
  resolvePluginOptions(inlinePlugins: PluginOption[] = []): PluginOption[] {
    const buildInPlugins: PluginOption[] = [
      {
        id: '@weflow/cli/lib/creator-plugins/install-service',
        module: require('./creator-plugins/install-service'),
      },
    ]

    return [...buildInPlugins, ...inlinePlugins]
  }

  resolvePlugins(
    pluginOptions: PluginOption[] = this.pluginOptions,
    context: string = this.context,
  ): { id: string; plugin: CreatorPlugin; config?: any }[] {
    return super.resolvePlugins(pluginOptions, context)
  }

  /**
   * 执行所有的插件 generator
   */
  async initPlugins(): Promise<void> {
    const plugins = this.resolvePlugins()

    plugins.forEach(({ id, plugin }) => {
      plugin.creator && plugin.creator(new CreatorAPI(id, this, this.depSources))
    })
  }
}
