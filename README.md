### steamerjs

Plugin is command, use when you plugin in.

插件即命令，即插即可用。

#### Installation

```
npm i -g steamerjs
```

#### Usage
```
steamer xxx

// alias command
str xxx
```

#### Builtin Plugins
* steamer-plugin-config
	- manage steamerjs config
```
// initialization local folder config
steamer config --init

or 

steamer config -i

// set config key and value
steamer config --set http-proxy=http://proxy.steamer.com

or 

steamer config -s http-proxy=http://proxy.steamer.com

// if set global, you can add -g or --global option


// delete config key
steamer config --del http-proxy

or

steamer config -d http-proxy

// if delete global config key, you can add -g or --global option


// list config value
steamer config --list

or 

steamer config -l

// if list global config, you can add -g or --global option

```

* steamer-plugin-list
	- list all available commands you can use
```
steamer list
```

#### Official Plugins
* [steamer-plugin-kit](https://github.com/SteamerTeam/steamer-plugin-kit)
	- starter kit management plugin 
* [steamer-plugin-pro](https://github.com/SteamerTeam/steamer-plugin-pro)
	- project management plugin 
* [steamer-plugin-ak](https://github.com/SteamerTeam/steamer-plugin-ak)
	- AlloyTeam AK offline platform

#### Official Starter Kit
* [steamer-example](https://github.com/SteamerTeam/steamer-example)
	- example starter kit
* [steamer-react](https://github.com/SteamerTeam/steamer-react) 
	- react starter kit
* [steamer-vue](https://github.com/SteamerTeam/steamer-vue)
	- vue starter kit
* [steamer-koa](https://github.com/SteamerTeam/steamer-koa)
	- koa starter kit
* [steamer-gulp](https://github.com/SteamerTeam/steamer-gulp)
	- gulp starter kit

#### Core Utils
* [steamer-pluginutils](https://github.com/SteamerTeam/steamer-pluginutils)
	- plugin utils

#### Starter Kit Utils
* [steamer-webpack-utils](https://github.com/SteamerTeam/steamer-webpack-utils)
	- steamer webpack starter kit utils

#### Tiny Tool Libraries
* [steamer-net](https://github.com/SteamerTeam/steamer-net)
	- ajax utils
* [steamer-responsive](https://github.com/SteamerTeam/steamer-responsive)
	- reponsive solution
* [steamer-cross](https://github.com/SteamerTeam/steamer-cross)
	- cross domain communication
* [steamer-timer](https://github.com/SteamerTeam/steamer-timer)
	- timer management utils
* [steamer-browserutils](https://github.com/SteamerTeam/steamer-browserutils)
	- browser util functions

