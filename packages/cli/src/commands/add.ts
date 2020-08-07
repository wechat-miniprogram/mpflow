import fs from 'fs'
import path from 'path'
import { CliPlugin } from '../CliRunner'
import { getPaths } from '../utils'

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

        await api.add(context, [pluginName])
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  )
}

export default create
