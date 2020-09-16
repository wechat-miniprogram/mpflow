module.exports = {
  appId: 'wx123',
  app: 'src/app',
  compileType: 'miniprogram',
  plugins: ['@mpflow/plugin-babel', '@mpflow/plugin-unit-test', ["1", {
    "first": true
  }], "2"],
}
