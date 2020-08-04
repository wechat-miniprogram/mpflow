import inquirer from 'inquirer'
import { CreatorPlugin } from '../Creator'

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

/**
 * 询问是否安装推荐的插件
 */
const recommended: CreatorPlugin = () => {}

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
    await api.installPlugins(pluginNames)
  })
}

export default recommended
