#!/usr/bin/env node

const { spawnSync } = require('child_process')
const { resolve } = require('path')

const resolveFromRoot = (...paths) => {
  return resolve(__dirname, '..', ...paths)
}

const cwd = process.cwd()

const babelConfigPath = resolveFromRoot('babel.config.js')

const argsToForward = [
  'src',
  '--config-file',
  babelConfigPath,
  '--extensions',
  '.js,.ts',
  '-d',
  './lib',
  '--ignore',
  '"**/*.test.{ts,js}"',
]

// Type-check our files
const { status } = spawnSync(`babel${process.platform === 'win32' ? '.cmd' : ''}`, argsToForward, {
  stdio: 'inherit',
  cwd,
})

process.exit(status)
