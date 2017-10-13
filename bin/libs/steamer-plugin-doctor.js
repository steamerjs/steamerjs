"use strict";

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

const logSymbols = require('log-symbols'),
	  semver = require('semver'),
	  baseVer = "6.11.4",
	  SteamerPlugin = require('steamer-plugin').default;

class DoctortPlugin extends SteamerPlugin {
	constructor(args) {
        super();
        this.argv = args || argv;
        this.pluginName = 'steamer-plugin-doctor';
	}
	
	isNodePathSet() {
		let globalNodeModules = this.getGlobalModules();
		return globalNodeModules !== undefined && globalNodeModules !== null && globalNodeModules !== "";
	}
	
	throwNodePathError() {
		throw new Error("You must set NODE_PATH correctly!!! Now it's undefined or empty\nYou can visit https://github.com/steamerjs/steamerjs to see how to set NODE_PATH");
	}
	
	isNodeVerRight() {
		let version = semver.valid(process.version);
	
		return semver.gt(version, baseVer);
	}
	
	throwNodeVerError() {
		throw new Error("Node version should be >= " + baseVer);
	}
	
	init() {
	
		if (this.isNodePathSet()) {
			console.log(logSymbols.success, " ", this.chalk.white('NODE_PATH is ' + this.getGlobalModules()));
		}
		else {
			console.log(logSymbols.error, " ", this.chalk.red('NODE_PATH is undefined\nYou can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH'));
		}
	
		if (this.isNodeVerRight()) {
			console.log(logSymbols.success, " ", this.chalk.white('Node Version is ' + process.version));
		}
		else {
			console.log(logSymbols.error, " ", this.chalk.red('Node Version should be >= ' + baseVer));
		}
	}
	
	help() {
		this.utils.printUsage('help you check steamer running environment!', 'doctor');
	}
};

module.exports = DoctortPlugin;
