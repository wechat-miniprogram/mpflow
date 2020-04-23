const fs = require('fs')
const path = require('path')
const spawn = require('cross-spawn')
const rm = require('rimraf').sync
const repo = require('./repo')
const success = require('./logger').success
const error = require('./logger').error
/**
 * js 和 ts 写两份代码，根据选项执行删除效果
 */
module.exports = function(projectName, template, language) {
    let projectPath = path.join(process.cwd(), projectName)
    if(fs.existsSync(projectPath)) {
        rm(projectPath)
    }

    let gitUrl = repo[template].url
    success('开始初始化代码')
    const {status, error: cloneError} = spawn.sync('git', ['clone','--depth=1', gitUrl])
    // 根据 template 命名选取不同 git 进行下拉
    
    if (!cloneError && status === 0) {
        try {
            rm(path.join(projectPath, '.git'))
            spawn.sync('npm', ['install'])
        } catch (err) {
            error('项目初始化失败，请手动执行： npm install')
        }
    }

}