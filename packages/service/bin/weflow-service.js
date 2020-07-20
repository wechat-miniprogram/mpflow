#!/usr/bin/env node

const { Runner } = require('../lib')

const runner = new Runner(process.cwd())

runner.run()
