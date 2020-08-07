#!/usr/bin/env node

const { resolveFromCwd } = require('./utils')
const rimraf = require('rimraf')

rimraf.sync(resolveFromCwd('lib'))

try {
  require('./build-js')
  require('./build-ts')
} catch (err) {
  console.error(err)
  process.exit(1)
}
