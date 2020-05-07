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
        gulp.task('ts', this.jobs.tsCompile())
        gulp.task('less', this.jobs.lessCompile())
        gulp.task('clean', this.jobs.clean())
        gulp.task('img', this.jobs.imgCompile())
        gulp.task('copy', this.jobs.copyFiles())

        // watch task
        gulp.task('watch-js', this.jobs.watchJs())
        gulp.task('watch-ts', this.jobs.watchTs())
        gulp.task('watch-less', this.jobs.watchLess())
        gulp.task('watch-img', this.jobs.watchImg())
        gulp.task('watch-copy', this.jobs.watch2Copy())

        gulp.task('compile', gulp.parallel('js','ts','less','img'))
        gulp.task('watch', gulp.parallel(
            "watch-ts",
            "watch-less",
            "watch-img",
            "watch-copy",
        ))

        gulp.task('dev',gulp.series(
            'clean',
            'copy',
            'compile',
            'watch'
        ))

        // watch job
        

        gulp.on('error', console.trace);
        gulp.on('error', err=>{
            error('err')
        });
    }
}