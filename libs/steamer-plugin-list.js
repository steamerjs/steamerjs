"use strict";

const fs = require('fs-extra'),
	  pluginUtils = require('steamer-pluginutils');

var utils = new pluginUtils();

const pluginPrefix = "steamer-plugin-";

function ListPlugin(argv) {
	this.argv = argv;
}

ListPlugin.prototype.init = function() {

	let files = fs.readdirSync(utils.globalNodeModules);

	files = files.filter((item, key) => {
		return item.indexOf(pluginPrefix) === 0;
	});

	utils.info("You have following commands: ");

	files.map((item, key) => {
		console.log(item.replace(pluginPrefix, ""));
	});
};

module.exports = ListPlugin;