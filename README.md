### steamerjs

Plugin is command, use when you plugin in.

插件即命令，即插即可用。

#### 安装

```
npm i -g steamerjs
```

#### Usage
```
steamer xxx

// alias command
str xxx
```

#### 内置插件
* steamer-plugin-config
	- 管理 steamerjs 配置
```
// 初始化本地文件夹配置
steamer config --init

或

steamer config -i

// 设置配置的键值
steamer config --set http-proxy=http://proxy.steamer.com

或

steamer config -s http-proxy=http://proxy.steamer.com

// 如果想设置全局配置，请加上 -g 或 --global 参数。


// 删除键值
steamer config --del http-proxy

或

steamer config -d http-proxy

// 如果想删除全局配置，请加上  -g 或 --global 参数。


// 罗列所有配置值
steamer config --list

或

steamer config -l

// 如果想罗列所有全局配置值，请加上  -g 或 --global 参数。

```

* steamer-plugin-list
	- 列出所有你可以使用的命令
```
steamer list
```

#### 官方插件
* [steamer-plugin-kit](https://github.com/SteamerTeam/steamer-plugin-kit)
	- 脚手架管理插件
* [steamer-plugin-pro](https://github.com/SteamerTeam/steamer-plugin-pro)
	- 多项目管理插件
* [steamer-plugin-ak](https://github.com/SteamerTeam/steamer-plugin-ak)
	- AlloyTeam AK 离线包平台打包插件

#### 官方脚手架
* [steamer-example](https://github.com/SteamerTeam/steamer-example)
	- 脚手架例子
* [steamer-simple](https://github.com/SteamerTeam/steamer-simple)
	- 一个基础而无框架的脚手架
* [steamer-react](https://github.com/SteamerTeam/steamer-react) 
	- react 脚手架
* [steamer-vue](https://github.com/SteamerTeam/steamer-vue)
	- vue 脚手架
* [steamer-koa](https://github.com/SteamerTeam/steamer-koa)
	- koa 脚手架
* [steamer-gulp](https://github.com/SteamerTeam/steamer-gulp)
	- gulp 脚手架

#### 核心 util 方法
* [steamer-pluginutils](https://github.com/SteamerTeam/steamer-pluginutils)

#### 脚手脚 util 方法
* [steamer-webpack-utils](https://github.com/SteamerTeam/steamer-webpack-utils)

#### 迷你小工具库
* [steamer-net](https://github.com/SteamerTeam/steamer-net)
	- ajax 请求
* [steamer-responsive](https://github.com/SteamerTeam/steamer-responsive)
	- 自适应方案 
* [steamer-cross](https://github.com/SteamerTeam/steamer-cross)
	- 跨域通讯
* [steamer-timer](https://github.com/SteamerTeam/steamer-timer)
	- 时间管函数
* [steamer-browserutils](https://github.com/SteamerTeam/steamer-browserutils)
	- 浏览器 util 方法

