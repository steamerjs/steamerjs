"use strict";

const SteamerPlugin = require('steamer-plugin').default,
	  path = require('path');

class ConfigPlugin extends SteamerPlugin {
	constructor(args) {
        super();
        this.argv = args || argv;
		this.pluginName = 'steamer-plugin-config';
	}

	init() {
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
	}
	
	/**
	 * create config
	 */
	createConfig() {
		// create global config file
		if (!this.fs.existsSync(path.join(this.globalHome, ".steamer/steamer.js"))) {
			this.createSteamerConfig({}, {
				isGlobal: true
			});
		}
	
		// create local config file
		this.createSteamerConfig({});
	
	}
	
	/**
	 * create config
	 * @return {Object} [config object]
	 */
	readConfig() {
		return this.readSteamerConfig();
	}
	
	/**
	 * list config key & values, local config extend global config
	 */
	list() {
		let config = this.readSteamerConfig();
	
		for (let key in config) {
			this.info(key + '=' + config[key] || '');
		}
	
	}
	
	/**
	 * get key value from command option
	 * @return {Object} [key: value pair]
	 */
	getKeyValue() {
		let argv = this.argv,
			kv = argv.set || argv.s,
			kvArr = (kv && kv !== true) ? kv.split("=") : [];
	
		let key = (kvArr.length > 0) ? kvArr[0] : "",
			value = (kvArr.length > 1) ? kvArr[1] : "";
	
		return {key, value};
	}
	
	/**
	 * set config key value
	 */
	set() {
		
		let kv = this.getKeyValue(),
			config = {};
	
		if (this.isGlobal) {
			config = this.readSteamerGlobalConfig();
		}
		else {
			config = this.readSteamerLocalConfig();
		}
	
		config[kv.key] = kv.value;
	
	
		this.createSteamerConfig(config, {
			isGlobal: this.isGlobal,
			overwrite: true,
		});
	
	}
	
	/**
	 * delete config key value
	 */
	del() {
		let argv = this.argv,
			key = argv.del || argv.d,
			config = {};
	
		if (this.isGlobal) {
			config = this.readSteamerGlobalConfig();
		}
		else {
			config = this.readSteamerLocalConfig();
		}
	
		delete config[key];
		
		this.createSteamerConfig(config, {
			isGlobal: this.isGlobal,
			overwrite: true,
		});
	}
	
	help() {
		this.printUsage('steamer config manager', 'config');
		this.printOption([
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
	}

};

module.exports = ConfigPlugin;