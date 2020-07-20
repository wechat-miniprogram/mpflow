import { BaseService, BaseServiceOptions } from '@weflow/service-core'
import { Generator } from './Generator'
import { exec } from './utils'

export interface InstallerOptions extends Omit<BaseServiceOptions, 'plugins'> {
  plugins?: string[]
}

export class Installer extends BaseService {
  public pluginNames: string[]

  constructor(context: string, { plugins, ...options }: InstallerOptions = {}) {
    super(context, {
      ...options,
      plugins: (plugins || []).map(id => ({
        id,
        plugin: import(id),
      })),
    })

    this.pluginNames = plugins || []
  }

  async install(generateAll = false): Promise<void> {
    await exec(this.context, 'yarn', ['install'])

    const { pluginNames } = this
    if (pluginNames.length) {
      await exec(this.context, 'yarn', ['link', ...pluginNames])
    }

    // TODO add to weflow.config.js

    if (generateAll || this.plugins.length) {
      const generator = new Generator(this.context, { plugins: generateAll ? [] : this.plugins })

      await generator.generate()

      await exec(this.context, 'yarn', ['install'])
    }
  }
}
