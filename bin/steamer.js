#!/usr/bin/env node
'use strict';
const path = require('path'),
	  yargs = require('yargs'),
	  argv = yargs.argv,
	  _ = require('lodash'),
	  config = require('../libs/config'),
	  pluginUtils = require('steamer-pluginutils');

const pkgPrefix = 'steamer-plugin-';

function Commander(args) {
	this.argv = args || argv;
	this.utils = new pluginUtils('steamerjs');
}

/**
 * init running plugin
 */
Commander.prototype.initPlugin = function() {
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
};

/**
 * reserver commands
 * @param  {String} cmd [command name]
 * @return {String}     [returned command name]
 */
Commander.prototype.reserveCmds = function(cmd) {

	let reserve = config.reserveCmd;

	reserve = reserve.map((item) => {
		return pkgPrefix + item;
	});

	if (reserve.indexOf(cmd) > -1) {
		cmd = "../libs/" + cmd;
	}
	else {
		cmd = path.join(this.utils.globalNodeModules, cmd);
	}

	return cmd;
};

/**
 * run plugin
 * @param  {String} pluginName [plugin name]
 * @param  {Ojbect} argv       [command argv from yargs]
 */
Commander.prototype.runPlugin = function(pluginName, argv) {
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
				this.utils.printTitle("Command Usage", "white");
				instance.help();
				this.utils.printEnd("white");
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
		this.utils.error(e.stack);
	}
};

/**
 * show version
 * @param  {String} pkg [plugin]
 */
Commander.prototype.showVersion = function(pkg) {
	if (path.isAbsolute(pkg)) {
		let pkgPath = path.join(pkg, "package.json"),
			pkgJson = require(pkgPath);

		this.utils.info(pkgJson.name + "@" + pkgJson.version);
	}
	else {
		let pkgPath = path.join(path.dirname(__dirname), "package.json"),
			pkgJson = require(pkgPath),
			plugin = path.basename(pkg);

		if (plugin.length > 2) {
			this.utils.info("built-in plugin: " + plugin + "\n" + pkgJson.name + "@" + pkgJson.version);
		}
		else {
			this.utils.info(pkgJson.name + "@" + pkgJson.version);
		}
	}
};

/**
 * show help
 */
Commander.prototype.help = function() {
	this.utils.printUsage('steamer core command', '[<plugin>] [--<option>]');
	this.utils.printOption([
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
};

/**
 * remove duplicate commands
 * @param  {Array} cmds [commands]
 * @return {Array}      [uinque commands]
 */
Commander.prototype.uniqueCmds = function(cmds) {
	let mainCommands = this.argv._,
		mainCommand = null;

	if (mainCommands.length) {
		mainCommand = mainCommands[0];
	}

	cmds = cmds.filter((item) => {
		return item !== mainCommand;
	});

	return cmds;
};

/**
 * plugins called before current running plugin
 */
Commander.prototype.pluginBeforeInit = function() {
	// make sure current main command is not in queue
	config.beforeInit = this.uniqueCmds(config.beforeInit);

	config.beforeInit.map((item) => {
		this.runPlugin(item, {_init: "before"});
	});
};

/**
 * plugins called after current running plugin
 */
Commander.prototype.pluginAfterInit = function() {
	// make sure current main command is not in queue
	config.afterInit = this.uniqueCmds(config.afterInit);

	config.afterInit.map((item) => {
		this.runPlugin(item, {_init: "after"});
	});
};

Commander.prototype.init = function() {
	this.pluginBeforeInit();
	this.initPlugin();
	this.pluginAfterInit();
};

// 用于测试
if (!process.env.steamer_test) {
	var commander = new Commander(argv);
	commander.init();
}

module.exports = Commander;



