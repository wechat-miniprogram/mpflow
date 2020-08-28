# `@mpflow/cli`

## 安装

```bash
npm install -g @mpflow/cli
# 或者
yarn global add @mpflow/cli
```

## 使用

### 创建一个项目

```bash
mpflow create hello-miniprogram
```

创建项目默认使用的小程序模板，可以通过指定 `--template` 参数来指定项目模板

```bash
# 创建一个小程序插件项目
mpflow create hello-plugin --template miniprogram-plugin
```

### 为项目安装插件

```bash
# 安装瘦身插件
mpflow add slim
# 或
mpflow add @mpflow/plugin-slim
```
