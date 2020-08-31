# `@mpflow/plugin-e2e-test`

> Mpflow 的 e2e 测试支持插件

## 说明

该插件用于给 Mpflow 的构架提供 e2e 测试功能的集成，使用 [jest](https://jestjs.io/) 为测试执行器，[miniprogram-automator](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/) 为自动化执行器

e2e 测试代码请按照 `${name}.test.js` 的命名形式，放置在项目的 `tests/e2e/` 目录下

测试文件默认注入了一个全局 `miniProgram` 对象，可以直接操纵小程序开发者工具，使用方法请参考 [miniprogram-automator 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/miniprogram.html)

## 安装

```bash
mpflow add e2e-test
# 或
mpflow add @mpflow/plugin-e2e-test
```

## 使用

在项目的 `tests/e2e` 文件夹下添加测试文件，如：

```js
// page-index.test.js

describe('page index', () => {
  let page

  beforeAll(async () => {
    page = await miniProgram.reLaunch('/pages/index/index')
    await page.waitFor(500)
  }, 30 * 1000)

  test('wxml', async () => {
    const element = await page.$('page')
    expect(await element.wxml()).toMatchSnapshot()
  })
})
```

然后执行命令启动 e2e 测试

```bash
npm run test:e2e
# 或
yarn test:e2e
```

也可以通过 `--coverage` 参数来获取代码覆盖率报告

```bash
npm run test:e2e -- --coverage
# 或
yarn test:e2e --coverage
```
