#!/usr/bin/env node

require('check-node-version')(require('../package.json').engines, function (err, result) {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  if (!result.isSatisfied) {
    for (var name in result.versions) {
      var info = result.versions[name]
      if (!info.isSatisfied) {
        console.error('需要安装 ' + name + ' ' + info.wanted)
      }
    }
    process.exit(1)
  }

  var ServiceRunner = require('../lib').ServiceRunner

  var runner = new ServiceRunner(process.cwd())

  runner.run()
})
