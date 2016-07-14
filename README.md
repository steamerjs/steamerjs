### 旧的steamer更名为[steamer-gulp](https://github.com/SteamerTeam/steamer-gulp)

# steamer发展成为多项目管理体系

## 安装

1. 新建一个项目文件夹（此处不主张全局安装）

2. 在项目文件夹里新建一个package.json

3. 使用以下方法：
npm install SteamerTeam/steamer --save

或在package.json里添加, 并npm install

```
"dependencies": {
    "steamer": "github:SteamerTeam/steamer"
},
```

## 起因
以前做项目的时候，由于重构的，或者尝试新的框架的关系，主体页面可能出现多种框架，管理起来不方便，不便如下：
* 启动开发环境的时候，需要多个命令
* 发布的时候，同时放到一个文件夹里比较麻烦，需要另外写一套外层构建
* node_modules包管理不方便，比较多的冗余

## 特点
* 一键进行开发以及生成编译好的文件
* 减少node_modules包冗余

## 管理目录的层级
一般来说，目录层级主要有2种类型：

* 平衡型
-- Main Project
---- A Project
---- B Project

适用范围：主要是多个不同类型的项目或者构建差别较大

* 父子型
-- Main Project
---- A Project
------ B Project

适用范围：主要是同构/直出、关键页面的项目重构等
对于父子型，steamer只支持两层


## 配置

下面就是基本的配置
```
var steamerConfig  = {
	projects: {   					// 项目具体配置
		react: {  					// react项目
			src: "./react/",		// 源代码文件夹
			cmds: {					// 运行命令，主要包括开发dev和发布的pub
				dev: "npm run dev", 
				pub: "npm run pub",
			},
		},
		model: {					// model项目
			src: "./model/",
			cmds: {
				dev: "npm run dev",
				pub: "npm run pub",
			},
		},
		node: {						// node项目
			src: "./node/",
			cmds: {
				dev: "npm start",
				pub: " ",			// 对于一些node项目，可能没有这个命令，因为不用编译
			},
		},
	},
	steps: {								// 针对命令的回调
		dev: {								// 开发命令
			start: function(config) {		// 命令开始

			},
			finish: function(config) {		// 命令结束
				
			}
		},
		pub: {								// 发布命令
			start: function(config) {		// 命令开始
				
			},
			finish: function(config) {      // 命令结束
				
				console.log(config.isEnd);


			}
		},
	},
	repos: {							    // 自己想加入steamer管理的boilerplate
        "react-cdk": { 
            git: "react-cdk",
            config: {
                src: "./react-cdk/",		// 默认源文位位置，可以通过npm --install --name [localName]的localName更改
                cmds: {
                    dev: "npm run dev", 
                    pub: "npm run pub",
                },
            },
        }
    }
};

module.exports = steamerConfig;
```

针对命令的回调，会传入针对某一命令传入对应的steamerConfig，但会添加如下属性

* ```currentProject```，表示是哪一个项目的命令开始/结束
* ```isEnd```，只出现在finish回调中，若为true，则表示所有项目的命令都已经结束

有了以上的回调，就可以进行一些命令开始前或结束后的操作，例如发布命令悉数结束后，可以将编译文件再拷贝一份进行离线包的打包


## package.json的变化
在此文件中，若使用stearm --install命令，子项目中可能会多出现dependenciesBk和devDependenciesBk。这2个用于备份之前的node_modules包设置。因为使用此安装命令，会将重复配置转移动主项目的package.json中，以减少冗余。


## 使用

* steamer --init 初始化项目并生成初始steamer.config.js


* steamer --get [remote repo] --name [localname] 安装steamer体系内的构建。

目前官方提供的repo如下：
* [steamer-react]()
* [steamer-react-isomorphic]()
* [steamer-gulp]()
* [steamer-koa]()
	
localName可以是某个现存project的子目录。例如steamer-react/steamer-koa。如果这要安装，steamer.config.js会自动生产如下配置：

	```
	var steamerConfig = {
	    "projects": {
	        "steamer-react": {
	            "src": "xxx\\project\\steamer-react",
	            "cmds": {
	                "dev": "npm run dev",
	                "pub": "npm run pub"
	            }
	        },
	        "steamer-koa": {
	            "src": "xxx\\project\\steamer-react\\node",
	            "cmds": {
	                "dev": "npm start",
	                "pub": ""
	            }
	        }
	    },
	}
	```

* steamer --install 进行项目的node_modules包安装和package.json配置
	
	若在```steamer --get``的时候安装node_modules失败，可以重新用steamer --install进行重新安装


* steamer --dev --project [project] 启动开发命令，添加--project参数可仅启动特定项目


* steamer --pub --project [project] 启动发布命令,添加--project参数可仅启动特定项目


* steamer --remove [project] 删除项目文件夹及对应steamer.config.js中projects的配置
	
	此命令也会对子目录的文件夹及steamer.config.js的配置一并删除



"steamer-core": "*",
"steamer-plugin-init": "*",
"steamer-plugin-config": "*",
"steamer-plugin-kit": "*"

