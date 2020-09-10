module.exports = function () {
  return {
    sourceType: 'unambiguous',
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          modules: false,
          targets: {
            chrome: 53,
            ios: 8,
          },
        },
      ],
    ],
    plugins: [
      [
        require.resolve('@babel/plugin-transform-runtime'),
        {
          corejs: false,
          helpers: true,
        },
      ],
    ],
    env: {
      test: {
        presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
      },
    },
  }
}
