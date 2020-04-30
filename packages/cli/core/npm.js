const path = require('path')
const fs = require('fs')
const spawn = require('cross-spawn')
const utils = require('./lib/utils')
const success = require('./lib/logger').success
const error = require('./lib/logger').error

// 直接接入 miniprogram-ci 的 npm 编译

module.exports =async function(target = 'dist', source) {
    if(!source) source = process.cwd()
    let packageJson = path.join(source, 'package.json')
    if(fs.existsSync(packageJson)) {
        let pkgObj = JSON.parse(fs.readFileSync(packageJson).toString())
        let dependencies = pkgObj.dependencies || {}
        dependencies = Object.keys(dependencies)

        // 检查 node_modules 是否存在
        if(!fs.existsSync(path.join(source, 'node_modules')) ) {
            try {
                success('npm install')
                spawn.sync('npm', ['install'],{stdio: 'inherit'})    
            } catch (err) {
                error('npm 安装失败')
                process.exit(1)
            }
        }

        // 遍历 dependencies
        for(let dependency of dependencies) {
            let packagePath = path.join(source, 'node_modules', dependency)
            let dPkg = utils.readJson(packagePath)
        }
        // 检查是否是 小程序 npm 包
        


        // 拷贝对象目录文件


    } else {
        error(`当前目录 ${source} 不存在 package.json`)
        process.exit(1)
    }
}