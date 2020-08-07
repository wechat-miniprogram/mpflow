#!/usr/bin/env node

const { resolveFromCwd, runScript } = require('./utils')
const { existsSync } = require('fs')

const tsconfigPath = resolveFromCwd('tsconfig.build.json')

try {
  if (existsSync(tsconfigPath)) {
    runScript('tsc', [
      '--outDir',
      './lib',
      '-p',
      tsconfigPath,
      '--declaration',
      '--emitDeclarationOnly',
      '--listEmittedFiles',
    ])
  }
} catch (error) {
  console.error(error)
  process.exit(1)
}
