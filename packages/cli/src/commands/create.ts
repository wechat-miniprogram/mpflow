import { Plugin } from '@weflow/service/src'
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
    async ({ appName, template, appId }) => {
      const createPath = api.resolve(appName)

      if (fs.existsSync(createPath)) throw new Error(`folder "${appName}" already exists`)
      if (!fs.existsSync(template)) throw new Error(`template "${template}" doesn't exists`)

      await fs.ensureDir(createPath)

      await api.callGenerator(createPath, {
        plugins: [
          {
            id: 'build-in:create-generator',
            plugin: Promise.resolve({
              default: createGeneratorPlugin(template, {
                appid: appId || '',
                projectname: appName,
              }),
            }),
          },
        ],
      })
    },
  )
}

function createGeneratorPlugin(templatePath: string, data: Record<string, any>): Plugin {
  const generatorPlugin: Plugin = () => {}

  generatorPlugin.generator = api => api.render(templatePath, data)

  return generatorPlugin
}

export default create
