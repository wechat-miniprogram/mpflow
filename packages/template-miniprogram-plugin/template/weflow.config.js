module.exports = {
  appId: '<%= appId %>',
  app: process.env.BUILD_APP ? 'src/miniprogram/app' : undefined,
  plugin: 'src/plugin/plugin',
  compileType: 'plugin',
  miniprogramRoot: 'miniprogram',
  pluginRoot: 'plugin',
  plugins: [],
}
