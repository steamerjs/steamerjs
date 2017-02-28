"use strict";

const fs = require('fs-extra'),
	  chalk = require('chalk'),
	  pluginUtils = require('steamer-pluginutils'),
	  config = require('./config');

var utils = new pluginUtils();
utils.pluginName = "steamer-plugin-config";

const pluginPrefix = "steamer-plugin-";

function ListPlugin() {
	
}

ListPlugin.description = "list steamerjs commands";

ListPlugin.prototype.init = function() {

	this.list();
	
};

ListPlugin.prototype.list = function() {
	let files = this.filterCmds();

	this.printTitle();

	files.map((item) => {
		utils.success(item.replace(pluginPrefix, ""));
	});

	this.printUsage();
};

ListPlugin.prototype.onExit = function() {
	
};

/**
 * get command names
 * @return {Array} [command file]
 */
ListPlugin.prototype.filterCmds = function() {
	let files = fs.readdirSync(utils.globalNodeModules);

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
	msg += utils.printTitle("Command Usage", "white");
	msg += utils.success("steamer <command>");
	msg += utils.success("steamer <command> --[<args>]");
	msg += utils.success("steamer <command> -[<args alias>]");
	msg += utils.printEnd("white");
	return msg;
};


ListPlugin.prototype.help = function() {
	utils.printUsage("list", "list all available commands");
};

module.exports = ListPlugin;