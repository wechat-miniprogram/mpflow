const imagemin = require('imagemin')
const through = require('through2')
const path = require('path')
const warn = require('../lib/logger').warn
const error = require('../lib/logger').error

module.exports = () => {
    return through.obj(
        (file, enc, cb) => {
            if(file.isNull()) {
                return cb(null, file)
            }

            if(file.isStream()) {
                warn('the file is Stream')              
                return cb(null, file)
            }

            let extName = path.extname(file.path).toLowerCase()
            let plugin
        
            switch(extName) {
                case '.svg':
                    const svgo = require('imagemin-svgo')
                    plugin = svgo()
                break
                case '.jpeg':
                case '.jpg':
                    const jpeg = require('imagemin-jpegtran')
                    plugin = jpeg()    
                break
                case '.gif':
                    const gif = require('imagemin-gifsicle')
                    plugin = gif()
                break
                case '.png':
                    const png = require('imagemin-pngquant')
                    plugin = png({
                        quality: [0.6, 0.8]
                    })
            }

            imagemin.buffer(file.contents, {
                plugins: [plugin]
            })
                .then(data => {
                    file.contents = data
                    cb(null,file)
                })
                .catch(err => {
                    error(err)
                    cb(new Error('图片编译失败'))
                })

        }
    )
}