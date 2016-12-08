#!/usr/bin/env node
"use strict";

const fs = require('fs'),
	  path = require('path'),
	  argv = require('yargs').argv,
	  _ = require('lodash');


const pkgPrefix = 'steamer-plugin-';

function Commander() {}

Commander.prototype.initPlugin = function() {
	// command example: steamer init
	let mainCommands = argv._,
		pkg = null,
		plugin = null;
	
	if (mainCommands.length) {
		// use the 1st value
		pkg = pkgPrefix + mainCommands[0];

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

Commander.prototype.init = function() {
	this.initPlugin();
};

var commander = new Commander();
commander.init();


module.exports = Commander;



