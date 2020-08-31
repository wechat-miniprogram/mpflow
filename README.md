# mpflow

mpflow 是微信小程序的命令行工具

- 面向原生，原有的小程序可以无缝切换
- 内置提供了基于 webpack 的小程序构建流程，从刀耕火种走向现代
- 通过插件提供开箱即用的 Babel, Typescript, Less, 单元测试 等能力
- 与小程序开发者工具深度结合

## 起步

### 安装

```bash
npm install -g @mpflow/cli
# 或
yarn global add @mpflow/cli
```

### 创建项目

```bash
mpflow create hello-miniprogram

cd hello-miniprogram # 进入到项目目录
```

该命令会在当前目录创建一个名为 `hello-miniprogram` 的小程序项目

### 项目开发

```bash
mpflow dev --open # 开启本地开发，并自动拉起小程序开发者工具
# 或
npm run dev:open
```

### 项目构建

```bash
mpflow build # 构建小程序，用于生产
# 或
npm run build
```

### 安装插件

```bash
mpflow add slim # 安装 @mpflow/plugin-slim 插件，可用于小程序瘦身
```

## 官方插件列表

- [`plugin-babel`](https://www.npmjs.com/package/@mpflow/plugin-babel)
- [`plugin-css`](https://www.npmjs.com/package/@mpflow/plugin-css)
- [`plugin-e2e-test`](https://www.npmjs.com/package/@mpflow/plugin-e2e-test)
- [`plugin-slim`](https://www.npmjs.com/package/@mpflow/plugin-slim)
- [`plugin-typescript`](https://www.npmjs.com/package/@mpflow/plugin-typescript)
- [`plugin-unit-test`](https://www.npmjs.com/package/@mpflow/plugin-unit-test)

## Packages

| Name                                | description                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| @mpflow/cli                         | cli 工具主要模块，处理用户的 cli 交互                         |
| @mpflow/plugin-babel                | babel 插件，提供 js 的转义能力                                |
| @mpflow/plugin-css                  | 样式处理插件，提供 less sass stylus 等支持                    |
| @mpflow/plugin-e2e-test             | e2e 测试插件，通过 jest + miniprogram-automator 提供 e2e 测试 |
| @mpflow/plugin-slim                 | 瘦身插件，提供代码重复度检查以及图片压缩等能力集成            |
| @mpflow/plugin-typescript           | typescript 插件，提供 typescript 支持                         |
| @mpflow/plugin-unit-test            | 单元测试插件，通过 jest 提供单元测试                          |
| @mpflow/service                     | 开发、构建、测试能力，安装到用户本地项目中，用户可选升级      |
| @mpflow/service-core                | cli 和 service-core 共用的一些通用代码                        |
| @mpflow/template-miniprogram        | 小程序创建模板                                                |
| @mpflow/template-miniprogram-plugin | 小程序插件创建模板                                            |
| @mpflow/test-utils                  | 测试工具（private)                                            |
| @mpflow/webpack-plugin              | 通过 webpack 构建小程序的 webpack 插件                        |
| @mpflow/wxml-loader                 | webpack 的 wxml loader                                        |
| @mpflow/wxss-loader                 | webpack 的 wxss loader                                        |
