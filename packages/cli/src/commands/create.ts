import fs from 'fs-extra'
import path from 'path'
import { CliPlugin } from '../CliRunner'

const create: CliPlugin = () => {}

create.cliRunner = (api, config) => {
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
        description: '创建小程序的模板路径',
        default: path.join(path.dirname(require.resolve('@weflow/template-miniprogram/package.json')), 'template'),
      },
      appId: {
        type: 'string',
        description: '创建小程序的 app id',
      },
    },
    async ({ appName, template: templatePath, appId }) => {
      const createPath = api.resolve(appName)

      if (fs.existsSync(createPath)) throw new Error(`folder "${appName}" already exists`)
      if (!fs.existsSync(templatePath)) throw new Error(`template "${templatePath}" doesn't exists`)

      await fs.ensureDir(createPath)

      await api.create(createPath, templatePath, {
        appId: appId || '',
        projectName: appName,
      })
    },
  )
}

export default create
