import fs from 'fs'
import path from 'path'
import { CliPlugin } from '../CliRunner'
import { getPaths, getNpmModuleInfo } from '../utils'

const create: CliPlugin = (api, config) => {
  api.registerCommand(
    'add <pluginName>',
    '下载并安装插件',
    {
      pluginName: {
        type: 'string',
        demandOption: true,
        description: '插件包名称',
      },
    },
    {},
    async ({ pluginName }) => {
      try {
        const checkInMpflowProject = (context: string) => fs.existsSync(path.join(context, 'mpflow.config.js'))

        // 向上查找 mpflow.config.js
        const context = getPaths(api.getCwd()).find(checkInMpflowProject)

        if (!context) {
          throw new Error('请在 mpflow 项目中执行该命令')
        }

        const { name: resolvedPluginName } = await getNpmModuleInfo(pluginName, pluginName => [
          `@mpflow/plugin-${pluginName}`,
          `mpflow-plugin-${pluginName}`,
          pluginName,
        ])

        await api.add(context, [resolvedPluginName])
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  )
}

export default create
