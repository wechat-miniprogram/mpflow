const MIN_BABEL_VERSION = 7

module.exports = api => {
  api.assertVersion(MIN_BABEL_VERSION)
  api.cache(true)

  return {
    presets: ['@babel/preset-typescript', '@babel/preset-env'],
    plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
  }
}
