# mpflow

mpflow 是微信小程序的命令行工具

- 面向原生，原有的小程序可以无缝切换
- 内置提供了基于 webpack 的小程序构建流程，从刀耕火种走向现代
- 通过插件提供开箱即用的 Babel, Typescript, Less, 单元测试 等能力
- 与小程序开发者工具深度结合

## 起步

### 安装

![demo-1](img/mpflow-demo-1-min.gif?raw=true)

```bash
npm install -g @mpflow/cli
# 或
yarn global add @mpflow/cli
```

### 创建项目

![demo-1](img/mpflow-demo-2-min.gif?raw=true)

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

![demo-1](img/mpflow-demo-3-min.gif?raw=true)

```bash
mpflow build # 构建小程序，用于生产
# 或
npm run build
```

### 安装插件

![demo-1](img/mpflow-demo-4-min.gif?raw=true)

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

## 现有小程序项目如何接入 mpflow？

### 限制

由于 mpflow 面向的是小程序原生开发构建，因此现有项目**必须为原生写法**才能接入。如使用 mpvue、taro 以及 kbone 等跨端框架均不能使用（也不需要）。

> 若你的项目是使用原生写法，配合一些简单的 gulp 脚本做代码转换，但整体项目结构依然为原生，则可以接入 mpflow

另外请注意 mpflow 暂时还不能覆盖小程序的所有使用场景，如分包，worker 等特性都暂时未支持

### 步骤

1. #### 为项目添加 `@mpflow/service` 依赖

    直接在项目下执行

    ```bash
    npm install @mpflow/service --save-dev
    # 或
    yarn add @mpflow/service --dev
    ```

1. #### 将项目源码都转移到 `src` 目录下

    一个比较典型的小程序目录结构会类似：
    ```
    node_modules/
    miniprogram_npm/
    components/
    -- comp/
      -- comp.js
      -- comp.json
      -- comp.wxml
      -- comp.wxss
    pages/
    -- index/
      -- index.js
      -- index.json
      -- index.wxml
      -- index.wxss
    app.js
    app.wxss
    app.json
    project.config.json
    package.json
    ```

    mpflow 为了更方便地管理源码和产物，会要求将项目源码以及图片视频等静态资源，都放置到 `src` 目录下。迁移后的目录结构会类似：

    ```
    node_modules/
    src/
    -- components/
    -- pages/
    -- app.js
    -- app.wxss
    -- app.json
    project.config.json
    package.json
    ```

    > miniprogram_npm 目录直接删除即可

1. #### 在项目根目录创建一个 `mpflow.config.js`

    `mpflow.config.js` 是 mpflow 的配置文件，原生小程序项目可以直接根据 project.config.json 来迁移。

    需要在 `mpflow.config.js` 中填写的内容参考：

    ```javascript
    module.exports = {
      appId: 'hello-miniprogram', // 填写项目名称，与 project.config.json 中的 projectname 相同即可
      app: 'src/app', // 小程序 app 入口路径，为按上述步骤迁移后的 app.js 所在位置相对项目根目录的路径
      compileType: 'miniprogram', // 小程序项目类型，与 project.config.json 中的 compileType 相同即可
      plugins: [], // 插件列表，留空
      settings: { // 项目配置，与 project.config.json 中的 settings 相同即可
        es6: false,
      }
    }
    ```

1. #### 测试项目构建

    之后即可用命令 `mpflow build` 尝试构建小程序

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
