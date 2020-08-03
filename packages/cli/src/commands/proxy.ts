import { CliPlugin } from '../CliRunner'

const create: CliPlugin = api => {
  api.proxyCommand('build', '构建小程序')
  api.proxyCommand('dev', '开发小程序')
  api.proxyCommand('inspect', '检查 weflow 构建配置')
}

export default create
