module.exports = function () {
  return {
    presets: [
      [
        require.resolve('@babel/preset-typescript'),
        {
          allowNamespaces: true,
          allowDeclareFields: true,
        },
      ],
    ],
    plugins: [
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
      require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
      require.resolve('@babel/plugin-proposal-optional-chaining'),
      require.resolve('@babel/plugin-proposal-export-namespace-from'),
    ],
  }
}
