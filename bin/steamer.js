#!/usr/bin/env node
'use strict';

const argv = require('yargs').argv,
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
Commander.prototype.runPlugin = function(pluginName, argv) {
	var plugin = null,
		pkg = pkgPrefix + pluginName;

	try {
		pkg = this.reserveCmds(pkg);
		plugin = require(pkg);
		if (_.isFunction(plugin) && _.isFunction(plugin.prototype.init)) {
			let instance = new plugin(argv);
			instance.init();
		}
		else {
			throw new Error(pkg + " is not a function or " + pkg + ".prototpe.init is not a function.");
		}
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
 * plugins called before current running plugin
 */
Commander.prototype.pluginBeforeInit = function() {
	config.beforeInit.map((item) => {
		this.runPlugin(item);
	});
};

/**
 * plugins called after current running plugin
 */
Commander.prototype.pluginAfterInit = function() {
	config.afterInit.map((item) => {
		this.runPlugin(item);
	});
};

Commander.prototype.init = function() {
	this.pluginBeforeInit();
	this.initUtilPlugin();
	this.initPlugin();
	this.pluginAfterInit();
};

var commander = new Commander(argv);
commander.init();

module.exports = Commander;



