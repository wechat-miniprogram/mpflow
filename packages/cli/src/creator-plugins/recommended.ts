import inquirer from 'inquirer'
import { CreatorPlugin } from '../Creator'
import { Generator } from '../Generator'

const recommended: CreatorPlugin = () => {}

const confirm = async (question: string): Promise<boolean> => {
  const { ans }: { ans: boolean } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ans',
      message: question,
    },
  ])
  return ans
}

recommended.creator = api => {
  const pluginNames: string[] = []
  api.tapPrepare(async infos => {
    const useTs = await confirm('是否启用 Typescript ?')
    if (useTs) {
      pluginNames.push('@weflow/plugin-babel', '@weflow/plugin-typescript')
    }

    if (!useTs) {
      const useBabel = await confirm('是否启用 babel ?')

      if (useBabel) {
        pluginNames.push('@weflow/plugin-babel')
      }
    }

    const useCss = await confirm('是否启用 css/less/sass/stylus ?')

    if (useCss) {
      pluginNames.push('@weflow/plugin-css')
    }

    return infos
  })

  api.tapInit(async () => {
    if (!pluginNames.length) return
    await api.installNodeModules(pluginNames)

    const plugins = pluginNames.map(id => ({ id }))

    const generator = new Generator(api.getCwd(), { plugins })

    // 将插件添加到 weflow.config.js
    generator.processFile('weflow.config.js', (file, api) => {
      api.transform(require('@weflow/service-core/lib/codemods/add-to-exports').default, {
        fieldName: 'plugins',
        items: pluginNames,
      })
    })

    await generator.generate()
    await api.installNodeModules()
  })
}

export default recommended
