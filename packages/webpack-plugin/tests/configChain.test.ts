import WebpackPlugin from '@mpflow/webpack-plugin'

const { ConfigChain } = WebpackPlugin

describe('ConfigChain', () => {
  test('should work', () => {
    const config = new ConfigChain()

    config.resolve.roots.add('/virtualRoot')
    config.resolve.javascript.extensions.add('.ts')
    config.resolve.wxss.extensions.add('.css').add('.less').add('.sass').add('.scss').add('.stylus')

    config.rules
      .wxss('less')
      .test(/\.less$/)
      .use('less-loader')
      .loader('less-loader')
    config.rules
      .wxss('sass')
      .test(/\.sass$/)
      .use('sass-loader')
      .loader('sass-loader')
      .options({ indentedSyntax: true })
    config.rules
      .wxss('scss')
      .test(/\.scss$/)
      .use('sass-loader')
      .loader('sass-loader')
    config.rules
      .wxss('stylus')
      .test(/\.stylus$/)
      .use('stylus-loader')
      .loader('stylus-loader')

    config.program.appId('wx123')
    config.program.compileType('miniprogram')
    config.program.projectName('test')
    config.program.miniprogramRoot('/miniprogram')
    config.program.pluginRoot('/plugin')
    config.program.qcloudRoot('/cloud')

    expect(config.toConfig()).toMatchSnapshot('toConfig')
    expect(config.toString()).toMatchSnapshot('toString')
  })
})
