# `@mpflow/plugin-unit-test`

> Mpflow 的小程序单元测试支持插件

## 说明

该插件用于给 Mpflow 的构架提供单元测试功能的集成，，使用 ![jest](https://jestjs.io/) 为测试执行器，![miniprogram-simulate](https://github.com/wechat-miniprogram/miniprogram-simulate) 为自动化执行器

`miniprogram-simulate` 是通过模拟小程序的运行环境，让小程序的自定义组件能够在 DOM 环境下进行测试。因此适用于对单一组件进行单元测试，而不适用与对整个小程序进行集成测试

## 安装

```bash
mpflow add unit-test
# 或
mpflow add @mpflow/plugin-unit-test
```

## 使用

在自定义组件目录下新增 `__test__` 文件夹，在文件夹下添加测试文件，如：

```js
// comp.test.js

import path from 'path'
import simulate from 'miniprogram-simulate'

describe('comp', () => {
    let id

    beforeAll(() => {
        id = simulate.load(path.resolve(__dirname, '../comp'), { less: true })
    })

    test('should match snapshot', () => {
        const comp = simulate.render(id, {})
        comp.attach(document.createElement('parent-wrapper'))

        expect(comp.toJSON()).toMatchSnapshot()
    })
})
```

然后执行命令启动单元测试

```bash
npm run test:unit
# 或
yarn test:unit
```

也可以通过 `--coverage` 参数来获取代码覆盖率报告

```bash
npm run test:unit -- --coverage
# 或
yarn test:unit --coverage
```
