"use strict";

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

const logSymbols = require('log-symbols'),
	  chalk = require('chalk'),
	  semver = require('semver');

function DoctortPlugin(argv) {
	this.argv = argv;
}

DoctortPlugin.prototype.isNodePathSet = function() {
	return process.env.NODE_PATH !== undefined && process.env.NODE_PATH !== null;
};

DoctortPlugin.prototype.throwNodePathError = function() {
	throw new Error("You must set NODE_PATH correctly!!! Now it's undefined\nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH");
};

DoctortPlugin.prototype.isNodeVerRight = function() {
	let version = semver.valid(process.version),
		baseVer = "5.0.0";

	return semver.gt(version, baseVer);
};

DoctortPlugin.prototype.throwNodeVerError = function() {
	throw new Error("Node version should be >= 5.0.0");
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
		console.log(logSymbols.error, " ", chalk.white('NODE_PATH is undefined'));
	}

	if (this.isNodeVerRight()) {
		console.log(logSymbols.success, " ", chalk.white('Node Version is ' + process.version));
	}
	else {
		console.log(logSymbols.error, " ", chalk.white('Node Version should be >= 5.0.0'));
	}
};

module.exports = DoctortPlugin;
