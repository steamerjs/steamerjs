"use strict";

const SteamerPlugin = require('steamer-plugin').default,
	  config = require('./config');

const pluginPrefix = 'steamer-plugin-';

class ListPlugin extends SteamerPlugin {
	constructor(args) {
        super();
        this.argv = args || argv;
		this.pluginName = 'steamer-plugin-list';
		this.description = 'list steamerjs commands';
	}

	init() {
		this.list();
	}
	
	list() {
		let files = this.filterCmds();
	
		this.printTitle();
	
		files.map((item) => {
			this.success(item.replace(pluginPrefix, ""));
		});
	
		this.printUsage();
	}
	
	/**
	 * get command names
	 * @return {Array} [command file]
	 */
	filterCmds() {
	
		if (!this.globalNodeModules) {
			return [];
		}
	
		let files = this.fs.readdirSync(this.globalNodeModules);
	
		files = files.filter((item) => {
			return item.indexOf(pluginPrefix) === 0;
		});
	
		files = files.concat(config.reserveCmd);
	
		return files;
	}
	
	/**
	 * print title
	 * @return {String} [title string]
	 */
	printTitle() {
		let msg = this.chalk.bold.white("Hello! You can use following commands: ");
		console.log(msg);
		return msg;
	}
	
	/**
	 * print usage 
	 * @return {String} [usage string]
	 */
	printUsage() {
		let msg = "";
		msg += this.printTitle("Command Usage", "white");
		msg += this.success("steamer <command>");
		msg += this.success("steamer <command> --[<args>]");
		msg += this.success("steamer <command> -[<args alias>]");
		msg += this.printEnd("white");
		return msg;
	}
	
	
	help() {
		this.printUsage("list all available commands", "list");
	}
};

module.exports = ListPlugin;