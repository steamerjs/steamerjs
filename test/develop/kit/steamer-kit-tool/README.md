# steamer-example

steamer starterkit 例子

## 目录规范

```javascript
.steamer -- steamer 配置
dist -- 生产环境代码
|
src -- 源代码
|
config -- 项目配置，用户主要关注配置，steamer不更新
|------project.js -- 项目配置
|------steamer.config.js -- 可由steamer生成，包括 webserver, cdn, port 等
|      |
|      |
tools  -- 构建工具，steamer帮助更新
|      |
|——————script.js -- 生产环境或开发环境执行命令
|——————webpack.base.js -- webpack 基础配置
|
package.json
```

## 命令规范

```javascript
// 开发环境
npm start

// 生产环境
npm run dist

// 测试
npm test

// 规范代码命令
npm run lint

// 模板生成
steamer kit -t
```

## 如何开发一个 steamer 规范的 starterkit

* 新建 `.steamer` 目录下的配置

你需要新建一个配置文件于 `.steamer` 目录下。如果你的 starterkit 名称是 `steamer-example`，那么配置的文件名必须是 `steamer-example.js`。

配置的例子如下：

```javascript
module.exports = {
    files: [
        "src",
        "tools",
        "config",
        "README.md",
        ".eslintrc.js",
        ".eslintignore",
        ".stylelintrc.js",
        ".stylelintignore",
        "postcss.config.js",
        ".gitignore",
        ".babelrc"
    ],
    options: [
        {
            type: 'input',
            name: 'webserver',
            message: 'html url(//localhost:9000/)',
            default: "//localhost:9000/",
        },
        {
            type: 'input',
            name: 'cdn',
            message: 'common cdn url(//localhost:8000/)',
            default: "//localhost:8000/",
        },
        {
            type: 'input',
            name: 'port',
            message: 'development server port(9000)',
            default: '9000',
        }
    ]
};
```

1. `files` 
    - 此配置是任何会被拷贝到开发目录下的文件夹或者文件。

2. `options` 
    - 我们使用 [inquirer](https://github.com/sboudrias/Inquirer.js) 去读取此配置，了解更多，可以去阅读 [inquirer](https://github.com/sboudrias/Inquirer.js)的文档。


* 在 `package.json` 中指定一个主要文件，此文件是上面添加的 `.steamer` 目录下的配置，因为 [steamer-plugin-kit](https://github.com/SteamerTeam/steamer-plugin-kit) 的命令运行时候需要读取它。

```javascript
"main": "./.steamer/steamer-example.js",
```

同时，在 `keywords` 中添加关键词 "steamer starterkit"。

```javascript
"keywords": [
    "steamer starterkit",
    // other keywords
]
```


## `Util` 库

开发脚手架时，常常需要一些 `Util` 函数，帮助你快速开发，`Steamer` 提供以下 `Util` 库：

* [steamer-webpack-utils](https://github.com/SteamerTeam/steamer-webpack-utils)


## 开发
```javascript
// 到 starterkit 开发目录下使用此命令，能使 starterkit 建立了一份全局的软链接
cd steamer-example
npm link

// 当你测试完后，请取消这个全局的软链接。
npm unlink steamer-example

```