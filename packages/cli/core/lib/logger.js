const chalk = require('chalk')
const through = require('through2')

exports.info = function(type, message) {
    console.log(`${chalk.bold.magenta(type)}: ${message}`)
}

exports.error = function(message) {
    console.log(chalk.red(message))
    process.exit(1)
}

exports.warn = function(message) {
    console.log(chalk.orange(message))
}

exports.success = function(message) {
    console.log(chalk.green(message))
}

exports.compileLog = function(opt) {
    let count = 0
    return through.obj( (file,enc, cb) => {
        let tips = chalk.bgGreenBright(opt.title) + ' ' + chalk.bgGrey ('=>') + ' '
        const fileName = path.relative(file.base, file.path)
        tips += chalk.gray(fileName) + ' | ' + chalk.bgGreen(file.path) 

        console.log(tips)

        count++
        cb(null,file)
    }, cb => {
        let tips =  chalk.bgGreenBright(opt.title) + ' ' + chalk.bgGrey ('=>') + ' '
            + chalk.green(count)
        console.log(tips)
        
        cb()
    })
}