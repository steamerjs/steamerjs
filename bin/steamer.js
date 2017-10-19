#!/usr/bin/env node
'use strict';

const path = require('path'),
    fs = require('fs'),
    yargs = require('yargs'),
    yargv = yargs.argv,
    _ = require('lodash'),
    SteamerPlugin = require('steamer-plugin');

const pkgPrefix = 'steamer-plugin-';
const config = require('./libs/config');

class Commander extends SteamerPlugin {
    constructor(args) {
        super();
        this.argv = args || yargv;
        this.pluginName = 'steamerjs';
    }

    /**
     * init running plugin
     */
    initPlugin() {
        // command example: steamer init
        let argv = this.argv,
            mainCommands = argv._;
        if (mainCommands.length) {
            // use the 1st value
            this.runPlugin(mainCommands[0], argv);
        }
        else {
            let isVersion = argv.ver || argv.v || false,
                isHelpCalled = argv.help || argv.h || false;

            if (isHelpCalled) {
                this.help();
            }
            else if (isVersion) {
                this.showVersion('../');
            }
        }
    }

    /**
     * reserve commands
     * @param  {String} cmd [command name]
     * @return {String}     [returned command name]
     */
    reserveCmds(cmd) {

        let route = path.join(__dirname, '../../', cmd),
            returnCmd = null;

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
            return pkgPrefix + item;
        });

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
        let Plugin = null,
            pkg = pkgPrefix + pluginName;

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
                    throw e;
                }
                else {
                    throw e;
                }
            }

            if (!_.isFunction(Plugin)) {
                throw new Error(pkg + ' is not a function. ');
            }

            let instance = new Plugin(argv);
            instance.argv = argv;
            instance.yargs = yargs;

            this.callCommands(argv, Plugin, instance, pkg);

            process.on('exit', (code) => {
                _.isFunction(Plugin.prototype.onExit) && instance.onExit(code);
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
        let isHelpCalled = argv.help || argv.h || false,
            isVersion = argv.ver || argv.v || false,
            isBeforeInit = (argv._init === 'before'),
            isAfterInit = (argv._init === 'after');

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
        // auto called, before init
        else if (isBeforeInit) {
            if (!_.isFunction(Plugin.prototype.beforeInit)) {
                throw new Error(pkg + '.prototpe.beforeInit is not a function. ');
            }

            instance.beforeInit();

        }
        // auto called, after init
        else if (isAfterInit) {
            if (!_.isFunction(Plugin.prototype.afterInit)) {
                throw new Error(pkg + '.prototpe.afterInit is not a function. ');
            }

            instance.afterInit();

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
            let pkgPath = path.join(pkg, 'package.json'),
                pkgJson = require(pkgPath);

            this.info(pkgJson.name + '@' + pkgJson.version);
        }
        else {
            let pkgPath = path.join(path.dirname(__dirname), 'package.json'),
                pkgJson = require(pkgPath),
                plugin = path.basename(pkg);

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

    /**
     * remove duplicate commands
     * @param  {Array} cmds [commands]
     * @return {Array}      [uinque commands]
     */
    uniqueCmds(cmds) {
        let mainCommands = this.argv._,
            mainCommand = null,
            returnCmds = null;

        if (mainCommands.length) {
            mainCommand = mainCommands[0];
        }

        returnCmds = cmds.filter((item) => {
            return item !== mainCommand;
        });

        return returnCmds;
    }

    /**
     * plugins called before current running plugin
     */
    pluginBeforeInit() {
        // make sure current main command is not in queue
        config.beforeInit = this.uniqueCmds(config.beforeInit);

        config.beforeInit.map((item) => {
            this.runPlugin(item, { _init: 'before' });
        });
    }

    /**
     * plugins called after current running plugin
     */
    pluginAfterInit() {
        // make sure current main command is not in queue
        config.afterInit = this.uniqueCmds(config.afterInit);

        config.afterInit.map((item) => {
            this.runPlugin(item, { _init: 'after' });
        });
    }

    init() {
        this.pluginBeforeInit();
        this.initPlugin();
        this.pluginAfterInit();
    }
}

// 用于测试
if (!process.env.steamer_test) {
    let commander = new Commander(yargv);
    commander.init();
}

module.exports = Commander;