#!/usr/bin/env node
"use strict";

const fs = require('fs'),
	  path = require('path'),
	  argv = require('yargs').argv,
	  _ = require('lodash'),
	  Err = require('steamer-core').Err,
	  Conf = require('steamer-core').Conf;


const pkgPrefix = 'steamer-plugin-';

function Commander() {

}

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
			if (_.has(plugin, 'init') && _.isFunction(plugin.init)) {
				plugin.init();
			}
		}
		catch(e) {
			console.log(e);
			if (e.code === 'MODULE_NOT_FOUND') {
				Err.PluginNotFond(pkg);
			}
		}
	} 
};

Commander.prototype.init = function() {
	this.initPlugin();
};

var commander = new Commander();
commander.init();


module.exports = Commander;



