# steamerjs

此包是 steamerjs 开发工具的核心库，其它插件的使用都一概依赖于此库的安装。steamerjs 的其它子命令都可以通过插件去实现，并且信奉：

Plugin is command, use when you plugin in.

插件即命令，即插即可用。

[![NPM Version](https://img.shields.io/npm/v/steamerjs.svg?style=flat)](https://www.npmjs.com/package/steamerjs)
[![Travis](https://img.shields.io/travis/steamerjs/steamerjs.svg)](https://travis-ci.org/steamerjs/steamerjs)
[![Deps](https://david-dm.org/steamerjs/steamerjs.svg)](https://img.shields.io/steamerjs/steamerjs)
[![Coverage](https://img.shields.io/coveralls/steamerjs/steamerjs.svg)](https://coveralls.io/github/steamerjs/steamerjs)


## 安装
javascript
```
// 安装核心库
npm i -g steamerjs

// 安装命令插件
npm i -g steamer-plugin-xxx
```


## 设置 `NODE_PATH`

由于 `steamerjs` 的命令或脚手架都需要全局安装，尽管steamerjs会尝试兼容，但在某些使用场景下会仍然找到不全局安装的位置，因此推荐设置环境变量 `NODE_PATH`。

[常见问题 - NODE_PATH设置](https://steamerjs.github.io/docs/introduction/Steamer-QA.html)


## 使用
```javascript
steamer xxx

// 或可使用简写 str
str xxx
```

## 内置插件
* [steamer-plugin-config](https://steamerjs.github.io/docs/builtin-plugins/Steamer-Plugin-Config.html)
* [steamer-plugin-develop](https://steamerjs.github.io/docs/builtin-plugins/Steamer-Plugin-Develop.html)
* [steamer-plugin-doctor](https://steamerjs.github.io/docs/builtin-plugins/Steamer-Plugin-Doctor.html)
* [steamer-plugin-kit](https://steamerjs.github.io/docs/plugins/Steamer-Plugin-Kit.html)
* [steamer-plugin-list](https://steamerjs.github.io/docs/builtin-plugins/Steamer-Plugin-List.html)
* [steamer-plugin-update](https://steamerjs.github.io/docs/builtin-plugins/Steamer-Plugin-Update.html)
* [steamer-plugin-team](https://steamerjs.github.io/docs/builtin-plugins/Steamer-Plugin-Team.html)


## 更新
```javascript
// 更新本身
npm install -g steamerjs@latest

// 更新插件
npm install -g steamer-plugin-xxx@latest

// 更新脚手架
npm install -g steamer-xxx@latest
```