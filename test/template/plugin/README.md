# steamer-plugin-example

steamer plugin 例子

* 确认是否已安装steamer CLI工具，如果还未安装，请参考https://github.com/steamerjs/steamerjs

完成这个example plugin之后，可以这样使用这个插件：

```javascript
steamer example -c config.js
// 或
steamer example --config config.js
```


## 如何写一个 steamerjs 插件

* 创建一个类，继承 [`steamer-plugin`](https://github.com/SteamerTeam/steamer-plugin)。此插件有许多辅助方法，请此往插件文件进行查询。

```javascript
class ExamplePlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-example';
        this.description = 'steamer plugin example';
    }

    init() {
        
    }

    help() {
        
    }
}
```
当在终端输入插件命令时，命令的参数将被传入这个函数

更多相关参数的文档，请参考 [yargs](https://github.com/yargs/yargs).

* `init` 函数

为类创建 `init` 方法， 插件命令在启动时会自动调用此函数。

```javascript
init() {
        
}
```

```javascript
// 导出此类
module.exports = ExamplePlugin;
```


* `help` 函数

为插件创建 `help` 方法

```javascript
help() {
        
}
```

当使用命令 `steamer [plugin name] -h` 或者 `steamer [plugin name] --help` 时，会自动调用 `help` 函数，用于输出插件帮助文档。

* 在package.json中指定入口

```javascript
"main": "index.js"
```

## 插件的使用

```javascript
// 将你的插件链接至全局路径，就可以直接使用 `steamer example`
npm link

// 当你完成开发，可以 `unlink` 你的插件
npm unlink

```
