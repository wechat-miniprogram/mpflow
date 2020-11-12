module.exports = function () {
  return {
    presets: [require.resolve('@babel/preset-typescript')],
    plugins: [[require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }]],
  }
}
