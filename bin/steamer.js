#!/usr/bin/env node

'use strict';

const path = require('path'),
    fs = require('fs'),
    yargs = require('yargs'),
    argv = yargs.argv,
    _ = require('lodash'),
    SteamerPlugin = require('steamer-plugin').default;

const pkgPrefix = 'steamer-plugin-';
const config = require('./libs/config');

class Commander extends SteamerPlugin {
    constructor(args) {
        super();
        this.argv = args || argv;
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
            let isVersion = argv.version || argv.v || false,
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
     * reserver commands
     * @param  {String} cmd [command name]
     * @return {String}     [returned command name]
     */
    reserveCmds(cmd) {
        
        let reserve = config.reserveCmd;
    
        reserve = reserve.map((item) => {
            return pkgPrefix + item;
        });
    
        if (reserve.indexOf(cmd) > -1) {
            cmd = "./libs/" + cmd;
        }
        else {
            let route = path.join(__dirname, '../../', cmd);
    
            if (fs.existsSync(route)) {
                cmd = route;
            }
            else {
                cmd = path.join(this.getGlobalModules(), cmd);
            }
        }
    
        return cmd;
    }

    /**
     * run plugin
     * @param  {String} pluginName [plugin name]
     * @param  {Ojbect} argv       [command argv from yargs]
     */
    runPlugin(pluginName, argv) {
        var argv = argv || {},
            plugin = null,
            pkg = pkgPrefix + pluginName,
            isHelpCalled = argv.help || argv.h || false,
            isVersion = argv.version || argv.v || false,
            isBeforeInit = (argv._init === "before"),
            isAfterInit = (argv._init === "after");
    
        try {
            pkg = this.reserveCmds(pkg);
    
            try {
                plugin = require(pkg);
            }
            catch(e) {
                if (e.code == 'MODULE_NOT_FOUND') {
                    this.error(pkg + " is not installed. One of following two reasons may cause this issue: ");
                    this.warn("1. You do not install this plugin.");
                    this.warn("2. You install the plugin but forget to set NODE_PATH.");
                    throw new Error(pkg + " is not installed. ");
                }
                else {
                    throw e;
                }
            }
    
            if (!_.isFunction(plugin)) {
                throw new Error(pkg + " is not a function. ");
            }
    
            var instance = new plugin(argv);
            instance.argv = argv;
            instance.yargs = yargs;
    
            if (isHelpCalled) {
                if (_.isFunction(plugin.prototype.help)) {
                    this.printTitle("Command Usage", "white");
                    instance.help();
                    this.printEnd("white");
                }
            }
            else if (isVersion) {
                this.showVersion(pkg);
            }
            else if (isBeforeInit) {
                if (!_.isFunction(plugin.prototype.beforeInit)) {
                    throw new Error(pkg + ".prototpe.beforeInit is not a function. ");
                }
    
                instance.beforeInit();
    
            }
            else if (isAfterInit) {
                if (!_.isFunction(plugin.prototype.afterInit)) {
                    throw new Error(pkg + ".prototpe.afterInit is not a function. ");
                }
    
                instance.afterInit();
    
            }
            else if (_.isFunction(plugin.prototype.init)) {
                instance.init();
            }
            else {
                throw new Error(pkg + ".prototpe.init is not a function. ");
            }
    
            process.on('exit', (code) => {
                _.isFunction(plugin.prototype.onExit) && instance.onExit(code);
            });
    
        }
        catch(e) {
            this.error(e.stack);
        }
    }

    /**
     * show version
     * @param  {String} pkg [plugin]
     */
    showVersion(pkg) {
        if (path.isAbsolute(pkg)) {
            let pkgPath = path.join(pkg, "package.json"),
                pkgJson = require(pkgPath);

            this.info(pkgJson.name + "@" + pkgJson.version);
        }
        else {
            let pkgPath = path.join(path.dirname(__dirname), "package.json"),
                pkgJson = require(pkgPath),
                plugin = path.basename(pkg);

            if (plugin.length > 2) {
                this.info("built-in plugin: " + plugin + "\n" + pkgJson.name + "@" + pkgJson.version);
            }
            else {
                this.info(pkgJson.name + "@" + pkgJson.version);
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
                option: "version",
                alias: "v",
                description: "show built-in or third-party plugin version"
            },
            {
                option: "help",
                alias: "h",
                description: "show built-in or third-party plugin help"
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
            mainCommand = null;

        if (mainCommands.length) {
            mainCommand = mainCommands[0];
        }

        cmds = cmds.filter((item) => {
            return item !== mainCommand;
        });

        return cmds;
    }

    /**
     * plugins called before current running plugin
     */
    pluginBeforeInit() {
        // make sure current main command is not in queue
        config.beforeInit = this.uniqueCmds(config.beforeInit);

        config.beforeInit.map((item) => {
            this.runPlugin(item, {_init: "before"});
        });
    }

    /**
     * plugins called after current running plugin
     */
    pluginAfterInit() {
        // make sure current main command is not in queue
        config.afterInit = this.uniqueCmds(config.afterInit);

        config.afterInit.map((item) => {
            this.runPlugin(item, {_init: "after"});
        });
    }

    init() {
        this.pluginBeforeInit();
        this.initPlugin();
        this.pluginAfterInit();
    }
};

// 用于测试
if (!process.env.steamer_test) {
	var commander = new Commander(argv);
	commander.init();
}

module.exports = Commander;