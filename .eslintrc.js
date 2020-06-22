module.exports = {
  root: true,
  parser: 'babel-eslint',
  ecmaFeatures: {
    modules: true,
  },
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'require-atomic-updates': 'off',
    // "no-unused-vars": "warn"
  },
}
