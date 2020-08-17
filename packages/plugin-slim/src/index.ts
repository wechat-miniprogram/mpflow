import { Plugin } from '@mpflow/service-core'
import path from 'path'

interface Options {}

const plugin: Plugin<Options> = (api, config, options) => {
  api.registerCommand(
    'slim-cpd <dir>',
    '检测源代码代码相似度',
    {
      dir: {
        type: 'string',
        demandOption: true,
        describe: '检测目录',
      },
    },
    {
      output: {
        type: 'string',
        alias: 'o',
        default: './report',
      },
    },
    async args => {
      const { jscpd } = require('jscpd')
      await jscpd(['', '', '-c', api.resolve('jscpd.json'), '-o', args.output, args.dir])
    },
  )
}

plugin.generator = (api, config, options) => {
  api.extendPackage({
    scripts: {
      'slim:cpd': 'mpflow-service slim-cpd',
    },
  })
  api.renderDir(path.resolve(__dirname, '../template'))
}

plugin.postInstall = async (api, config) => {
  console.log('postInstall')
  return {}
}

export default plugin
