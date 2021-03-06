#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const updateNotifier = require('update-notifier');
const yargs = require('yargs');
const yargv = yargs.argv;
const _ = require('lodash');
const SteamerPlugin = require('steamer-plugin');

const config = require('./libs/config');

class Commander extends SteamerPlugin {
    constructor(args) {
        super();
        this.argv = args || yargv;
        this.config = this.readSteamerConfig();
        this.pkgPrefix = this.config.PLUGIN_PREFIX || 'steamer-plugin-';
        this.pluginName = 'steamerjs';
        this.instance = null; // command instance
    }

    /**
     * init running plugin
     */
    initPlugin() {
        // command example: steamer init
        let argv = this.argv;
        let mainCommands = argv._;
        if (mainCommands.length) {
            // use the 1st value
            this.runPlugin(mainCommands[0], argv);
        }
        else {
            let isVersion = argv.ver || argv.v || false;
            let isHelpCalled = argv.help || argv.h || false;

            if (isHelpCalled) {
                this.help();
            }
            else if (isVersion) {
                this.showVersion('../');
            }
        }

        // 查看 steamerjs有没有更新
        this.checkPluginUpdate();
    }

    /**
     * 检查包更新
     * @param {Boolean} isCore 是否 steamerjs 库
     * @param {String} pkgJsonPath package.json 路径
     */
    checkPluginUpdate(isCore = true, pkgJsonPath = null) {
        let pkg = isCore ? require('../package.json') : require(pkgJsonPath);
        let notifier = updateNotifier({
            pkg,
            updateCheckInterval: 0,
        });

        notifier.notify({
            isGlobal: true
        });

        return notifier;
    }

    /**
     * reserve commands
     * @param  {String} cmd [command name]
     * @return {String}     [returned command name]
     */
    reserveCmds(cmd) {

        let route = path.join(__dirname, '../../', cmd);
        let returnCmd = null;

        // shortcut path
        if (fs.existsSync(route)) {
            returnCmd = route;
            return returnCmd;
        }

        // global node_module path
        returnCmd = path.join(this.getGlobalModules(), cmd);

        if (fs.existsSync(returnCmd)) {
            return returnCmd;
        }

        // reserved commands
        let reserve = config.reserveCmd;

        reserve = reserve.map((item) => {
            return this.pkgPrefix + item;
        });
        // TODO 更换prefix时候的命名冲突
        if (reserve.indexOf(cmd) > -1) {
            returnCmd = './libs/' + cmd;
            return returnCmd;
        }

        return returnCmd;
    }

    /**
     * run plugin
     * @param  {String} pluginName [plugin name]
     * @param  {Ojbect} argv       [command argv from yargs]
     */
    runPlugin(pluginName, argv = {}) {
        let Plugin = null;
        let pkg = this.pkgPrefix + pluginName;

        try {
            pkg = this.reserveCmds(pkg);

            try {
                Plugin = require(pkg);
            }
            catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    this.warn('Please run \"steamer doctor\" to detect the problem 1 & 2. ');
                    this.warn('Please see detailed erros message for problem 3.');

                    let msg = pkg + ' is not installed. One of following two reasons may cause this issue: \n';
                    msg += '1. You do not install this plugin.\n';
                    msg += '2. You install the plugin but forget to set NODE_PATH.\n';
                    msg += '3. There are internal errors inside the plugin.\n';
                    this.error(msg);

                    this.warn('Detailed Error Message: ');
                }
                throw e;
            }

            if (!_.isFunction(Plugin)) {
                throw new Error(pkg + ' is not a function. ');
            }

            this.instance = new Plugin(argv);
            this.instance.argv = argv;
            this.instance.yargs = yargs;

            this.callCommands(argv, Plugin, this.instance, pkg);

            // 检查使用的插件是否有更新
            let pkgJsonPath = path.join(pkg, 'package.json');
            if (fs.existsSync(pkgJsonPath)) {
                this.checkPluginUpdate(false, pkgJsonPath);
            }

            process.on('exit', (code) => {
                _.isFunction(Plugin.prototype.onExit) && this.instance.onExit(code);
            });

        }
        catch (e) {
            this.error(e.stack);
        }
    }

    /**
     * call plugin function
     * @param {Object} argv command argvs
     * @param {Object} Plugin steamer plugin
     * @param {Object} instance instance of Plugin
     * @param {String} pkg steamer plugin name
     */
    callCommands(argv, Plugin, instance, pkg) {
        let isHelpCalled = argv.help || argv.h || false;
        let isVersion = argv.ver || argv.v || false;

        // --help -h
        if (isHelpCalled) {
            if (_.isFunction(Plugin.prototype.help)) {
                this.printTitle('Command Usage', 'white');
                instance.help();
                this.printEnd('white');
            }
        }
        // --version -h
        else if (isVersion) {
            this.showVersion(pkg);
        }
        // auto called, init
        else if (_.isFunction(Plugin.prototype.init)) {
            instance.init();
        }
        else {
            throw new Error(pkg + '.prototpe.init is not a function. ');
        }
    }

    /**
     * show version
     * @param  {String} pkg [plugin]
     */
    showVersion(pkg) {
        if (path.isAbsolute(pkg)) {
            let pkgPath = path.join(pkg, 'package.json');
            let pkgJson = require(pkgPath);

            this.info(pkgJson.name + '@' + pkgJson.version);
        }
        else {
            let pkgPath = path.join(path.dirname(__dirname), 'package.json');
            let pkgJson = require(pkgPath);
            let plugin = path.basename(pkg);

            if (plugin.length > 2) {
                this.info('built-in plugin: ' + plugin + '\n' + pkgJson.name + '@' + pkgJson.version);
            }
            else {
                this.info(pkgJson.name + '@' + pkgJson.version);
            }
        }
    }

    /**
     * show help
     */
    help() {
        this.printUsage('steamer core command', '[<plugin>] [--<option>]');
        this.printOption([
            {
                option: 'ver',
                alias: 'v',
                description: 'show built-in or third-party plugin version'
            },
            {
                option: 'help',
                alias: 'h',
                description: 'show built-in or third-party plugin help'
            }
        ]);
    }

    init() {
        this.initPlugin();
    }
}

// 用于测试
if (!process.env.steamer_test) {
    let commander = new Commander(yargv);
    commander.init();
}

module.exports = Commander;