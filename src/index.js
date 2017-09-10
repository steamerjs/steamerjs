#!/usr/bin/env node

import SteamerPlugin from 'steamer-plugin';
import path from 'path';
import yargs from 'yargs';

const pkgPrefix = 'steamer-plugin-',
	argv = yargs.argv;

export default class Steamer extends SteamerPlugin {
	constructor(args) {
		super();
		this.argv = args || argv;
	}

	init() {
		this.initPlugin();
	}

	/**
	 * init running plugin
	 */
	initPlugin() {
		// command example: steamer init
		let argv = this.argv,
			mainCommands = argv._;

		if (mainCommands.length) {
			// use the 1st value
			this.runPlugin(mainCommands[0], argv);
		}
		else {
			let isVersion = argv.version || argv.v || false,
				isHelpCalled = argv.help || argv.h || false;

			if (isHelpCalled) {
				this.help();
			}
			else if (isVersion) {
				this.showVersion('../');
			}
		}
	}

	/**
	 * run plugin
	 * @param  {String} pluginName [plugin name]
	 * @param  {Ojbect} argv       [command argv from yargs]
	 */
	runPlugin(pluginName, argv) {
		var argv = argv || {},
			plugin = null,
			pkg = pkgPrefix + pluginName,
			isHelpCalled = argv.help || argv.h || false,
			isVersion = argv.version || argv.v || false;
			// isBeforeInit = (argv._init === "before"),
			// isAfterInit = (argv._init === "after");

		require.main.paths.push('./plugins/');
		require.main.paths.push(super.getGlobalModules());

		// console.log(require.main.paths);

		try {
			plugin = require(pkg);
		}
		catch (e) {
			if (e.code == 'MODULE_NOT_FOUND') {
				this.error(pkg + " is not found. One of following two reasons may cause this issue: ");
				this.warn("1. The plugin is not an internal plugin.");
				this.warn("2. You do not install this plugin.");
				this.warn("3. You install the plugin but forget to set NODE_PATH.");
				throw new Error(pkg + " is not installed. ");
			}
			else {
				throw e;
			}
		}

		if (!this._.isFunction(plugin)) {
			throw new Error(pkg + " is not a function. ");
		}

		var instance = new plugin(argv);
		instance.argv = argv;
		instance.yargs = yargs;

			if (isHelpCalled) {
				if (this._.isFunction(plugin.prototype.help)) {
					this.printTitle("Command Usage", "white");
					instance.help();
					this.printEnd("white");
				}
			}
			else if (isVersion) {
				this.showVersion(pkg);
			}
		// 	else if (isBeforeInit) {
		// 		if (!_.isFunction(plugin.prototype.beforeInit)) {
		// 			throw new Error(pkg + ".prototpe.beforeInit is not a function. ");
		// 		}
		//
		// 		instance.beforeInit();
		//
		// 	}
		// 	else if (isAfterInit) {
		// 		if (!_.isFunction(plugin.prototype.afterInit)) {
		// 			throw new Error(pkg + ".prototpe.afterInit is not a function. ");
		// 		}
		//
		// 		instance.afterInit();
		//
		// 	}
			else if (this._.isFunction(plugin.prototype.init)) {
				instance.init();
			}
		// 	else {
		// 		throw new Error(pkg + ".prototpe.init is not a function. ");
		// 	}
		//
		// 	process.on('exit', (code) => {
		// 		_.isFunction(plugin.prototype.onExit) && instance.onExit(code);
		// 	});
		//
		// }
		// catch(e) {
		// 	this.utils.error(e.stack);
		// }
	}
};

var steamer = new Steamer();

steamer.init();
