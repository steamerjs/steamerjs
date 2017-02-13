"use strict";

const fs = require('fs-extra'),
	  pluginUtils = require('steamer-pluginutils'),
	  config = require('./config');

var utils = new pluginUtils();
utils.pluginName = "steamer-plugin-config";

const pluginPrefix = "steamer-plugin-";

function ListPlugin(argv) {
	this.argv = argv;
}

ListPlugin.prototype.init = function() {

	let files = this.filterCmds();

	utils.info("You have following steamer commands: ");

	files.map((item) => {
		utils.warn(item.replace(pluginPrefix, ""));
	});
};

ListPlugin.prototype.filterCmds = function() {
	let files = fs.readdirSync(utils.globalNodeModules);

	files = files.filter((item) => {
		return item.indexOf(pluginPrefix) === 0;
	});

	files = files.concat(config.cmds);

	return files;
};

module.exports = ListPlugin;