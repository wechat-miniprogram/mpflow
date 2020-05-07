const gulp = require('gulp')
const path = require('path')
const gulpif = require('gulp-if')
const less = require('gulp-less')
const rename = require('gulp-rename')
const babel = require('gulp-babel')
const sourcemaps = require('gulp-sourcemaps')
const ts = require('gulp-typescript')
const rm = require('rimraf').sync
const imgCompress = require('./img-compress')
const logMid = require('../lib/logger').compileLog
/**
 * 1. 先 run 一遍
 * 2. watch 住对应文件
 */

module.exports = class TaskJobs{
    constructor(weflowConfig) {
        this.src = weflowConfig.src
        this.dist = weflowConfig.dist
        this.less = weflowConfig.compiler.less
        this.js = weflowConfig.compiler.js
        this.watchDelay = 1200 

        this.IMG_EXT = ['png', 'jpg', 'jpeg', 'svg', 'gif']

    }

    /**
     * 编译 less/wxss
     */
    lessCompile(){
        return () =>{
            return this.compileLess('**/*.less')
        }
    }
    watchLess() {
        return () => {
            gulp.watch('**/*.less', {
                base: this.src,
                cwd: this.src,
                delay: this.watchDelay
            })
            .change(file => {
                return this.compileLess(file)
            })
            .add( file => {
                return this.compileLess(file)
            })
        }
    }

    compileLess(source) {
        return gulp.src(source, {
            base: this.src,
            cwd: this.src
        })
        .pipe(gulpif(this.less.sourcemap, sourcemaps.init()))
        .pipe(less({paths: [this.src], compress: true}))
        .pipe(rename({extname: '.wxss'}))
        .pipe(gulpif(this.less.sourcemap, sourcemaps.write('./')))
        .pipe(gulp.dest(this.dist))
        .pipe(logMid({
            title: 'LESS'
        }))
    }
    
    /**
     * 编译JS/TS
     */
    jsCompile() {
        return () => {
            // 主要是 import 转 require
            return this.compileJs('**/*.js')
        }
    }
    watchJs() {
        return () => {
            gulp.watch('**/*.js', {
                base: this.src,
                cwd: this.src,
                delay: this.watchDelay
            })
            .change(file => {
                return this.compileJs(file)
            })
            .add( file => {
                return this.compileJs(file)
            })
        }
    }
    compileJs(source) {
        // 主要是 import 转 require
        return gulp.src(source, {
            base: this.src,
            cwd: this.src
        })
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(this.dist))
        .pipe(logMid({
            title: 'JS'
        }))
    }

    compileTs(source) {
        // 初始化 tsConfig
        const tsProject = ts.createProject('tsconfig.json');

        return gulp.src(source, {
            base: this.src,
            cwd: this.src
        })
        .pipe(tsProject())
        .js
        .pipe(gulp.dest(this.dist))
        .pipe(logMid({
            title: 'TS'
        }))
    }
    tsCompile() {
        return () => {
           return this.compileTs('**/*.ts')
        }
    }
    watchTs() {
        return () => {
            gulp.watch('**/*.ts', {
                base: this.src,
                cwd: this.src,
                delay: this.watchDelay
            })
            .change(file => {
                return this.compileTs(file)
            })
            .add( file => {
                return this.compileTs(file)
            })
        }
    }

    /**
     * 图片压缩
     */
    imgCompile() {
        return () => {
            return this.compileImg(`**/*.{${this.IMG_EXT.join(',')}}`)
        }
        
    }
    watchImg() {
        return () => {
            gulp.watch(`**/*.{${this.IMG_EXT.join(',')}}`, {
                base: this.src,
                cwd: this.src,
                delay: this.watchDelay
            })
            .change(file => {
                return this.compileImg(file)
            })
            .add( file => {
                return this.compileImg(file)
            })
        }
    }
    compileImg(source) {
        return gulp.src(source, {
            base: this.src,
            cwd: this.src
        })
        .pipe(imgCompress())
        .pipe(gulp.dest(this.dist))
        .pipe(logMid({
            title: 'Image'
        }))
    }

    /**
     * 拷贝 wxss, wxml, json,
     */
    copyFiles() {
        return () => {
            return gulp.src('**/*.{wxss,wxml,json,.config.json,.wxs}', {
                cwd: this.src,
                base: this.src
            }).pipe(gulp.dest(this.dist))
            .pipe(logMid({
                title: 'Copy'
            }))
        }
    }
    watch2Copy() {
        return () => {
            return gulp.watch('**/*.{wxss,wxml,json,.config.json,.wxs}', {
                base: this.src,
                cwd: this.src,
                delay: this.watchDelay
            })
            .change(file => {
                return gulp.src(file).pipe(gulp.dest(this.dist))
                .pipe(logMid({
                    title: 'Copy'
                }))
            })
            .add( file => {
                return gulp.src(file).pipe(gulp.dest(this.dist))
                .pipe(logMid({
                    title: 'Copy'
                }))
            })
        }
    }

    /**
     * 
     * @param {*} cb gulp 的回调
     */
    clean() {
        return (cb) => {
            const distPath = path.join(process.cwd(), this.dist)
            rm(distPath)
            cb()
        }
    }
}