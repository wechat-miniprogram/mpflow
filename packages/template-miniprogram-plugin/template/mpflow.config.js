module.exports = {
  appId: '<%= appId %>',
  app: (mode) => (mode !== "production" ? "src/miniprogram/app" : undefined),
  plugin: 'src/plugin/plugin',
  compileType: 'plugin',
  miniprogramRoot: 'miniprogram',
  pluginRoot: 'plugin',
  plugins: [],
}
