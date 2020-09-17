module.exports = {
  plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
}
exports.presets = (exports.presets || []).concat(["1", "2"]);
