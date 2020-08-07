const path = require('path')
const fs = require('fs')
const Tasks = require('./jobs/index')
const error = require('./lib/logger').error
const success = require('./lib/logger').success

// 1. 读取 mpflow.config.js
// 2. 如果不存在提示手动创建
// 3. 指定 dev 流程

// dev 流程
// 1. clean
// 2. compile
// 3. watch

const defaultCompiler = {
  less: {},
  js: {},
}

module.exports = function (config = 'mpflow.config.js') {
  let configPath = path.join(process.cwd(), config)

  if (!fs.existsSync(configPath)) {
    error(`文件不存在： ${configPath}`)
    process.exit(1)
  }

  let mpflowConf = require(configPath)

  /**
   * 字段检查
   */
  if (!mpflowConf.src) {
    error('mpflow.config.js src 字段缺失')
    process.exit(1)
  }

  if (!mpflowConf.dist) {
    error('mpflow.config.js dist 字段缺失')
  }

  let compiler = Object.assign({}, defaultCompiler, mpflowConf.compiler)

  success('开始编译')

  /**
   * 初始化任务
   */
  let tasks = new Tasks({
    src: mpflowConf.src,
    dist: mpflowConf.dist,
    compiler,
  })

  tasks.dev()
}
