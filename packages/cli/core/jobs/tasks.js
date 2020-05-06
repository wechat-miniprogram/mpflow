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

        this.IMG_EXT = ['png', 'jpg', 'jpeg', 'svg', 'gif']

    }

    /**
     * 编译 less/wxss
     */
    lessCompile(){
        return () =>{
            return gulp.src('**/*.less', {
                base: this.src,
                cwd: this.src
            })
            .pipe(gulpif(this.less.sourcemap, sourcemaps.init()))
            .pipe(less({paths: [this.src], compress: true}))
            .pipe(rename({extname: '.wxss'}))
            .pipe(gulpif(this.less.sourcemap, sourcemaps.write('./')))
            .pipe(gulp.dest(this.dist))
        }
    }

    /**
     * 编译JS/TS
     */
    jsCompile (){
        return () => {
            // 主要是 import 转 require
            return gulp.src('**/*.js', {
                base: this.src,
                cwd: this.src
            })
            .pipe(gulpif(this.less.sourcemap, sourcemaps.init()))
            .pipe(babel({
                presets: ['@babel/env']
            }))
            .pipe(gulpif(this.less.sourcemap, sourcemaps.write('./')))
            .pipe(gulp.dest(this.dist))
        }
    }
    tsCompile() {
        return () => {
            // 初始化 tsConfig
            const tsProject = ts.createProject('tsconfig.json');

            return gulp.src('**/*.ts', {
                base: this.src,
                cwd: this.src
            })
            .pipe(tsProject())
            .js
            .pipe(gulp.dest(this.dist))
        }

    }

    /**
     * 图片压缩
     */
    imgCompile() {
        return () => {
            gulp.src(`**/*.{${this.IMG_EXT.join(',')}}`, {
                cwd: this.src,
                base: this.src
            })
            .pipe(imgCompress())
            .pipe(gulp.dest(this.dist))
        }
        
    }

    /**
     * 拷贝 wxss, wxml, json,
     */
    copyFiles() {
        return () => {
            return gulp.parallel(() => {
                // copy wxss
                return gulp.src('**/*.wxss', {
                    cwd: this.src,
                    base: this.src
                })
                .pipe(gulp.dest(this.dist))
            }, () => {
                // copy wxml
                return gulp.src('**/*.wxml', {
                    cwd: this.src,
                    base: this.src
                })
                .pipe(gulp.dest(this.dist))
            }, () => {
                return gulp.src('**/*.json', {
                    cwd: this.src,
                    base: this.src
                })
                .pipe(gulp.dest(this.dist))
            }, () => {
                return gulp.src('**/*.wxs', {
                    cwd: this.src,
                    base: this.src
                })
                .pipe(gulp.dest(this.dist))
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