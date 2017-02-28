#!/usr/bin/env node
'use strict';

const yargs = require('yargs'),
	  argv = yargs.argv,
	  _ = require('lodash'),
	  chalk = require('chalk'),
	  config = require('../libs/config');

const pkgPrefix = 'steamer-plugin-';

function Commander(args) {
	this.argv = args || argv;
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

	return cmd;
};

/**
 * run plugin
 * @param  {String} pluginName [plugin name]
 * @param  {Ojbect} argv       [command argv from yargs]
 */
Commander.prototype.runPlugin = function(pluginName, argv = {}) {
	var plugin = null,
		pkg = pkgPrefix + pluginName,
		isHelpCalled = argv.help || argv.h || false,
		isBeforeInit = (argv._init === "before"),
		isAfterInit = (argv._init === "after");

	try {
		pkg = this.reserveCmds(pkg);
		plugin = require(pkg);

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
			_.isFunction(plugin.prototype.prevInit) && instance.prevInit();
			
			instance.init();

			_.isFunction(plugin.prototype.postInit) && instance.postInit();

		}
		else {
			throw new Error(pkg + ".prototpe.init is not a function. ");
		}

		process.on('exit', (code) => {
			_.isFunction(plugin.prototype.onExit) && instance.onExit(code);
		});

	}
	catch(e) {
		console.log(chalk.red(e.toString()));
	}
};

/**
 * init steamer plugin util function
 */
Commander.prototype.initUtilPlugin = function() {
	const pluginUtils = require('steamer-pluginutils');
	this.utils = new pluginUtils('steamerjs');
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
	this.initUtilPlugin();
	this.pluginBeforeInit();
	this.initPlugin();
	this.pluginAfterInit();
};

var commander = new Commander(argv);
commander.init();

module.exports = Commander;



