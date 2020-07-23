import { Plugin } from '@weflow/service-core'

const inspect: Plugin = api => {
  api.registerCommand('inspect', '检查 webpack 配置', {}, async args => {
    const webpackChain = require('webpack-chain')
    const { default: highlight } = await import('cli-highlight')

    const webpackConfig = api.resolveWebpackConfig()

    const output = webpackChain.toString(webpackConfig)
    console.log(highlight(output, { language: 'js' }))
  })
}

inspect.generator = (api, config) => {
  api.extendPackage({
    scripts: {
      inspect: 'weflow-service inspect',
    },
  })
}

export default inspect
