const program = require('commander')
const inquirer = require('inquirer')
const repo = require('../core/repo')
const error = require('../core/logger').error


program
  .version(require('../package.json').version, '-v, --version')
  .usage('<command> [options]');

program
  .command('init <projectName>')
  .description('generate a new project of weflow')
  .action( projectName =>{
    if(projectName) return error('请配置 projectName, init <projectName>')

      return inquirer
        .prompt([
          {
            type: 'list',
            name: 'template',
            message: '请选择小程序开发类型',
            choices: [
              {
                name: '小程序应用',
                value: repo.app.name
              },
              {
                name: '小程序插件',
                value: repo.plugin.name
              },
              {
                name: '小程序自定义组件',
                value: repo.component.name
              },
              {
                name: '云开发应用',
                value: repo.cloud.name
              }
            ]
          },
          {
            type: 'list',
            name: 'language',
            message: '请选择开发语言',
            choices: [
              {
                name: 'javascript',
                value: 'js'
              },
              {
                name: 'typescript',
                value: 'ts'
              }
            ]
          }
        ])
        .then( answers => {
            require('../core/init')(
              projectName, answers.template, answers.list
            )
        })
  })