module.exports = function () {
  return {
    presets: [[require.resolve('@babel/preset-env'), { useBuiltIns: 'usage', corejs: 3 }]],
    env: {
      test: {
        presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
      },
    },
  }
}
