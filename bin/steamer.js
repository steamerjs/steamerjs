#!/usr/bin/env node
'use strict';

const argv = require('yargs').argv,
	  _ = require('lodash'),
	  config = require('../libs/config');

const pkgPrefix = 'steamer-plugin-';

function Commander(args) {
	this.argv = args || argv;
}

Commander.prototype.initPlugin = function() {
	// command example: steamer init
	let argv = this.argv,
		mainCommands = argv._;
        	
	if (mainCommands.length) {
		// use the 1st value
		this.runPlugin(mainCommands[0], argv);
	} 
};

Commander.prototype.reserveCmds = function(cmd) {

	var mapping = config.cmds;

	mapping = mapping.map((item) => {
		return pkgPrefix + item;
	});

	if (mapping.indexOf(cmd) > -1) {
		cmd = "../libs/" + cmd;
	}

	return cmd;
};

Commander.prototype.runPlugin = function(pluginName, argv) {
	var pkg = pkgPrefix + pluginName,
		plugin = null;
	pkg = this.reserveCmds(pkg);

	try {
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
		// this.util may be not init
		if(this.utils) {
			this.utils.error(e.stack);
		} else {
			throw new Error(e.toString());
		}
		
	}
};

Commander.prototype.initUtilPlugin = function() {
	const pluginUtils = require('steamer-pluginutils');
	this.utils = new pluginUtils();
	this.utils.pluginName = "steamerjs";
};

Commander.prototype.pluginBeforeInit = function() {
	config.initPlugin.map((item) => {
		this.runPlugin(item);
	});
};

Commander.prototype.init = function() {
	this.pluginBeforeInit();
	this.initUtilPlugin();
	this.initPlugin();
};



var commander = new Commander(argv);
commander.init();


module.exports = Commander;



