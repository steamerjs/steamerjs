"use strict";

const pluginUtils = require('steamer-pluginutils'),
	  config = require('./config');

const pluginPrefix = "steamer-plugin-";

var chalk = null,
	fs = null;

function ListPlugin() {
	this.utils = new pluginUtils("steamerjs");
	chalk = this.utils.chalk;
	fs = this.utils.fs;
}

ListPlugin.description = "list steamerjs commands";

ListPlugin.prototype.init = function() {

	this.list();
	
};

ListPlugin.prototype.list = function() {
	let files = this.filterCmds();

	this.printTitle();

	files.map((item) => {
		this.utils.success(item.replace(pluginPrefix, ""));
	});

	this.printUsage();
};

/**
 * get command names
 * @return {Array} [command file]
 */
ListPlugin.prototype.filterCmds = function() {

	if (!this.utils.globalNodeModules) {
		return [];
	}

	let files = fs.readdirSync(this.utils.globalNodeModules);

	files = files.filter((item) => {
		return item.indexOf(pluginPrefix) === 0;
	});

	files = files.concat(config.reserveCmd);

	return files;
};

/**
 * print title
 * @return {String} [title string]
 */
ListPlugin.prototype.printTitle = function() {
	let msg = chalk.bold.white("Hello! You can use following commands: ");
	console.log(msg);
	return msg;
};

/**
 * print usage 
 * @return {String} [usage string]
 */
ListPlugin.prototype.printUsage = function() {
	let msg = "";
	msg += this.utils.printTitle("Command Usage", "white");
	msg += this.utils.success("steamer <command>");
	msg += this.utils.success("steamer <command> --[<args>]");
	msg += this.utils.success("steamer <command> -[<args alias>]");
	msg += this.utils.printEnd("white");
	return msg;
};


ListPlugin.prototype.help = function() {
	this.utils.printUsage("list all available commands", "list");
};

module.exports = ListPlugin;