#!/usr/bin/env node

const { CliRunner } = require('../lib')

const runner = new CliRunner(process.cwd())

runner.run()
