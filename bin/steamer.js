#!/usr/bin/env node
'use strict';

const argv = require('yargs').argv,
	  _ = require('lodash');


const pkgPrefix = 'steamer-plugin-';

function Commander(args) {
	this.argv = args || argv;
}

Commander.prototype.initPlugin = function() {
	// command example: steamer init
	let argv = this.argv,
		mainCommands = argv._,
		pkg = null,
		plugin = null;
        	
	if (mainCommands.length) {
		// use the 1st value
		pkg = pkgPrefix + mainCommands[0];
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
			console.log(e.stack);
		}
	} 
};

Commander.prototype.reserveCmds = function(cmd) {

	var mapping = ['config', 'list'];

	mapping = mapping.map((item) => {
		return pkgPrefix + item;
	});

	if (mapping.indexOf(cmd) > -1) {
		cmd = "../libs/" + cmd;
	}

	return cmd;
};

Commander.prototype.init = function() {
	this.initPlugin();
};

var commander = new Commander(argv);
commander.init();


module.exports = Commander;



