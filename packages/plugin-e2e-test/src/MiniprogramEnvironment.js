const NodeEnvironment = require('jest-environment-node')
const automator = require('miniprogram-automator')
const path = require('path')

class MiniprogramEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config)
    this.projectPath = config.testEnvironmentOptions.projectPath || path.resolve(process.cwd(), './dist')
  }

  async setup() {
    await super.setup()
    this.global.miniProgram = await automator.launch({
      projectPath: this.projectPath,
    })
  }

  async teardown() {
    await this.global.miniProgram.close()
    await super.teardown()
  }
}

module.exports = MiniprogramEnvironment
