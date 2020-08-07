import fs from 'fs-extra'
import { CliPlugin } from '../CliRunner'

const create: CliPlugin = (api, config) => {
  api.registerCommand(
    'create <appName>',
    '创建小程序',
    {
      appName: {
        type: 'string',
        demandOption: true,
        description: '小程序名称',
      },
    },
    {
      template: {
        type: 'string',
        description: '创建小程序的模板包名称',
        default: '@mpflow/template-miniprogram',
      },
      appId: {
        type: 'string',
        description: '创建小程序的 app id',
      },
    },
    async ({ appName, template: templateName, appId }) => {
      try {
        const createPath = api.resolve(appName)

        if (fs.existsSync(createPath)) throw new Error(`文件夹或文件 "${appName}" 已经存在`)

        await fs.ensureDir(createPath)

        await api.create(createPath, templateName, {
          appId: appId || '',
          projectName: appName,
        })
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  )
}

export default create
