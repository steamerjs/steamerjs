"use strict";

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

const logSymbols = require('log-symbols'),
	  chalk = require('chalk'),
	  semver = require('semver'),
	  pluginUtils = require('steamer-pluginutils'),
	  baseVer = "5.0.0";

function DoctortPlugin(argv) {
	this.argv = argv;
	this.utils = new pluginUtils("steamer");
}

DoctortPlugin.prototype.isNodePathSet = function() {
	return process.env.NODE_PATH !== undefined && process.env.NODE_PATH !== null;
};

DoctortPlugin.prototype.throwNodePathError = function() {
	throw new Error("You must set NODE_PATH correctly!!! Now it's undefined\nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH");
};

DoctortPlugin.prototype.isNodeVerRight = function() {
	let version = semver.valid(process.version);

	return semver.gt(version, baseVer);
};

DoctortPlugin.prototype.throwNodeVerError = function() {
	throw new Error("Node version should be >= " + baseVer);
};

DoctortPlugin.prototype.beforeInit = function() {

	if (!this.isNodePathSet()) {
		this.throwNodePathError();
	}

	if (!this.isNodeVerRight()) {
		this.throwNodeVerError();
	}
};

DoctortPlugin.prototype.init = function() {

	if (this.isNodePathSet()) {
		console.log(logSymbols.success, " ", chalk.white('NODE_PATH is ' + process.env.NODE_PATH));
	}
	else {
		console.log(logSymbols.error, " ", chalk.red('NODE_PATH is undefined\nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH'));
	}

	if (this.isNodeVerRight()) {
		console.log(logSymbols.success, " ", chalk.white('Node Version is ' + process.version));
	}
	else {
		console.log(logSymbols.error, " ", chalk.red('Node Version should be >= ' + baseVer));
	}
};

DoctortPlugin.prototype.help = function() {
	this.utils.printUsage('help you check steamer running environment!', 'doctor');
};

module.exports = DoctortPlugin;
