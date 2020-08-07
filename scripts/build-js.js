#!/usr/bin/env node

const { resolveFromRoot, runScript } = require('./utils')

const babelConfigPath = resolveFromRoot('babel.config.js')

try {
  runScript('babel', [
    'src',
    '--config-file',
    babelConfigPath,
    '--extensions',
    '.js,.ts',
    '--out-dir',
    'lib',
    '--ignore',
    '**/__tests__',
    '--verbose',
  ])
} catch (error) {
  console.error(error)
  process.exit(1)
}
