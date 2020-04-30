const chalk = require('chalk')

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