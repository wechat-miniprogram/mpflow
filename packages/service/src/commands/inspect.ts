import { Plugin } from '@weflow/service-core'

const inspect: Plugin = api => {
  api.registerCommand('inspect', '检查 webpack 配置', {}, async args => {
    const { default: highlight } = await import('cli-highlight')
    const {
      default: { toString },
    } = await import('webpack-chain')

    const webpackConfig = api.resolveWebpackConfig()

    const output = String(webpackConfig)
    console.log(highlight(output, { language: 'js' }))
  })
}

export default inspect
