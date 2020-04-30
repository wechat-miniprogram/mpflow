const fs = require('fs')

async function checkIsMiniprogramPack(dir, json) {
    let relativeDistDir = 'miniprogram_dist'
    if (json.miniprogram && typeof json.miniprogram === 'string') {
      relativeDistDir = json.miniprogram
    }
  
    try {
      const distDir = path.join(dir, relativeDistDir) // 默认小程序 npm 包 dist 目录
      await accessSync(distDir)
      const fileStat = await statSync(distDir)
      if (fileStat && fileStat.isDirectory()) {
        return distDir
      }
    } catch (err) {
      // ignore
    }
  
    return ''
  }

function readJson(pkgPath) {
    return JSON.parse(fs.readFileSync(pkgPath).toString())
}

module.exports = {
    checkIsMiniprogramPack,
    readJson
}