#!/usr/bin/env node

const { ServiceRunner } = require('../lib')

const runner = new ServiceRunner(process.cwd())

runner.run()
