"use strict";

const fs = require('fs-extra'),
	  path = require('path'),
	  pluginUtils = require('steamer-pluginutils');


function ConfigPlugin(argv) {
	this.argv = argv;
	this.utils = new pluginUtils("steamer");
}

ConfigPlugin.prototype.init  = function() {
	let argv = this.argv;

	this.isGlobal = this.argv.global || this.argv.g;

	if (argv.init || argv.i) {
		this.createConfig();
	}
	else if (argv.set || argv.s) {
		this.set();
	}
	else if (argv.del || argv.d) {
		this.del();
	}
	else if (argv.list || argv.l) {
		this.list();
	}
};

/**
 * create config
 */
ConfigPlugin.prototype.createConfig  = function() {
	// create global config file
	if (!fs.existsSync(path.join(this.utils.globalHome, ".steamer/steamer.js"))) {
		this.utils.createSteamerConfig({}, {
			isGlobal: true
		});
	}

	// create local config file
	this.utils.createSteamerConfig({});

};

/**
 * create config
 * @return {Object} [config object]
 */
ConfigPlugin.prototype.readConfig  = function() {
	return this.utils.readSteamerConfig();
};

/**
 * list config key & values, local config extend global config
 */
ConfigPlugin.prototype.list = function() {
	let config = this.utils.readSteamerConfig();

	for (let key in config) {
		this.utils.info(key + '=' + config[key] || '');
	}

};

/**
 * get key value from command option
 * @return {Object} [key: value pair]
 */
ConfigPlugin.prototype.getKeyValue  = function() {
	let argv = this.argv,
		kv = argv.set || argv.s,
		kvArr = (kv && kv !== true) ? kv.split("=") : [];

	let key = (kvArr.length > 0) ? kvArr[0] : "",
		value = (kvArr.length > 1) ? kvArr[1] : "";

	return {key, value};
};

/**
 * set config key value
 */
ConfigPlugin.prototype.set = function() {
	
	let kv = this.getKeyValue(),
		config = {};

	if (this.isGlobal) {
		config = this.utils.readSteamerGlobalConfig();
	}
	else {
		config = this.utils.readSteamerLocalConfig();
	}

	config[kv.key] = kv.value;


	this.utils.createSteamerConfig(config, {
		isGlobal: this.isGlobal,
		overwrite: true,
	});

};

/**
 * delete config key value
 */
ConfigPlugin.prototype.del = function() {
	let argv = this.argv,
		key = argv.del || argv.d,
		config = {};

	if (this.isGlobal) {
		config = this.utils.readSteamerGlobalConfig();
	}
	else {
		config = this.utils.readSteamerLocalConfig();
	}

	delete config[key];
	
	this.utils.createSteamerConfig(config, {
		isGlobal: this.isGlobal,
		overwrite: true,
	});
};

ConfigPlugin.prototype.help = function() {
	this.utils.printUsage('steamer config manager', 'config');
	this.utils.printOption([
		{
			option: "list",
			alias: "l",
			description: "list config key=value"
		},
		{
			option: "init",
			alias: "i",
			description: "initiate config in current working directory"
		},
		{
			option: "set",
			alias: "s",
			value: "<key>=<value> [-g|--global]",
			description: "set key value in local or global config"
		},
		{
			option: "del",
			alias: "d",
			value: "<key> [-g|--global]",
			description: "delete key value in local or global config"
		}
	]);
};

module.exports = ConfigPlugin;