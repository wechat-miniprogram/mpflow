import chalk from 'chalk'
import path from 'path'
import type fs from 'fs'
import { getNpmModuleInfo } from './utils'
import semver from 'semver'
import CliTable from 'cli-table3'
import ConfigStore from 'configstore'
import boxen from 'boxen'
import crypto from 'crypto'

function md5(source: string): string {
  const hash = crypto.createHash('md5')
  return hash.update(source).digest('hex').toString()
}

const cliPkg = require('../package.json')

// 检查更新间隔 1 天
const CHECK_UPDATE_INTERVAL = 1000 * 60 * 60 * 24

export interface UpdatePackageInfo {
  /**
   * 包名
   */
  name: string
  /**
   * 当前已安装的版本号，undefined 为未安装
   */
  currentVersion: string | undefined
  /**
   * 最新的版本号
   */
  latestVersion: string
  /**
   * 声明的依赖版本号范围
   */
  // versionRange: string
  /**
   * 最新的符合版本号范围的版本号
   */
  // latestSatisfiedVersion: string
  /**
   * 包类型
   * global 全局安装包
   * local 本地安装包
   */
  type: string
}

/**
 * 获取一个项目下可以升级的 mpflow 包列表
 * @param inputFileSystem
 * @param cwd
 * @param pkg
 */
export async function getUpdatablePackages(
  inputFileSystem: typeof fs,
  cwd: string,
  pkg: any,
): Promise<UpdatePackageInfo[]> {
  const dependencies = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  }

  // mpflow 的依赖包
  const mpflowPackages = Object.keys(dependencies)
    .filter(packageName => /^(@mpflow\/|mpflow-)/.test(packageName))
    .map(packageName => {
      const pkgPath = path.resolve(cwd, 'node_modules', packageName, 'package.json')
      const pkgInfo = inputFileSystem.existsSync(pkgPath)
        ? JSON.parse(inputFileSystem.readFileSync(pkgPath, 'utf-8'))
        : {}
      return {
        name: packageName,
        type: 'local',
        currentVersion: (pkgInfo.version as string) || undefined,
        // versionRange: semver.coerce(dependencies[packageName])
      }
    })

  // cli 也进行版本号检查
  mpflowPackages.unshift({
    name: '@mpflow/cli',
    type: 'global',
    currentVersion: cliPkg.version,
  })

  // 获取包的最新版本号
  const latestMpflowPackages = await Promise.all(
    mpflowPackages.map(async pkgInfo => {
      const { version: latestVersion } = await getNpmModuleInfo(pkgInfo.name)
      return {
        ...pkgInfo,
        latestVersion,
      }
    }),
  )

  return latestMpflowPackages.filter(pkgInfo => {
    return pkgInfo.currentVersion && semver.gt(pkgInfo.latestVersion, pkgInfo.currentVersion)
  })
}

/**
 * 展示更新内容
 * @param pkgInfos
 */
export function showUpdateInfo(pkgInfos: UpdatePackageInfo[]): void {
  const table = new CliTable({
    // head: ['Package', 'Version'],
    colAligns: ['left', 'left'],
    style: { head: [] },
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ' ',
    },
  })

  pkgInfos.forEach(pkgInfo => {
    table.push([
      chalk.magenta(pkgInfo.name),
      `${chalk.dim(pkgInfo.currentVersion)} => ${chalk.green(pkgInfo.latestVersion)}`,
    ])
  })

  const message = boxen(
    `发现以下可用更新！\n${table.toString()}\n${/*执行 ${chalk.green(`mpflow update`)} 命令更新*/ ''}`,
    {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'yellow',
      borderStyle: 'round' as any,
    },
  )
  console.log(message)
}

function getConfigStore(cwd: string): ConfigStore {
  return new ConfigStore(`${cliPkg.name}-${md5(cwd)}`, { lastUpdateCheck: 0 })
}

/**
 * 判断是否需要检查更新
 */
export function shouldCheckForUpdates(cwd: string): boolean {
  const configStore = getConfigStore(cwd)
  const isCI = require('ci-info').isCI

  return Date.now() - configStore.get('lastUpdateCheck') >= CHECK_UPDATE_INTERVAL && !isCI
}

/**
 * 检查更新
 * @param inputFileSystem
 * @param cwd
 * @param pkg
 */
export async function checkForUpdates(inputFileSystem: typeof fs, cwd: string, pkg: any): Promise<void> {
  const configStore = getConfigStore(cwd)
  configStore.set('lastUpdateCheck', Date.now())

  const updatablePackages = await getUpdatablePackages(inputFileSystem, cwd, pkg)

  if (updatablePackages.length) {
    showUpdateInfo(updatablePackages)
  }
}
