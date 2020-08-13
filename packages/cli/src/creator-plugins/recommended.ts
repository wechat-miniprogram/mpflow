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
    // 默认安装 babel 插件
    pluginNames.push('@mpflow/plugin-babel')

    if (await confirm('是否启用 Typescript ?')) {
      pluginNames.push('@mpflow/plugin-typescript')
    }

    if (await confirm('是否启用 css/less/sass/stylus ?')) {
      pluginNames.push('@mpflow/plugin-css')
    }

    if (await confirm('是否启用 单元测试 ?')) {
      pluginNames.push('@mpflow/plugin-unit-test')
    }

    return infos
  })

  api.tapInit(async () => {
    if (!pluginNames.length) return
    await api.installPlugins(pluginNames)
  })
}

export default recommended
