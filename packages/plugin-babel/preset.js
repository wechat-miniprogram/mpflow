module.exports = function () {
  return {
    presets: [[require.resolve('@babel/preset-env'), { useBuiltIns: 'usage' }]],
    env: {
      test: {
        presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
      },
    },
  }
}
