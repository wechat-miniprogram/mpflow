const Jobs = require('./tasks')
const gulp = require('gulp')
const error = require('../lib/logger').error

// 初始化 jobs

module.exports = class {
    constructor(config) {
        this.jobs = new Jobs(config)
    }
    dev() {
        this.initJob()
        gulp.series('dev')(err=>{
            if(err) {
                error(err)
                process.exit(1)
            }
        })
    }
    initJob() {
        gulp.task('js', this.jobs.jsCompile())
        gulp.task('less', this.jobs.lessCompile())
        gulp.task('clean', this.jobs.clean())

        gulp.task('compile', gulp.parallel('js', 'less'))

        gulp.task('dev',gulp.series(
            'clean',
            'compile'
        ))

        gulp.on('error', console.trace);
        gulp.on('error', err=>{
            error('err')
        });
    }
}