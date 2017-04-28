"use strict";

const pluginutils = require('steamer-pluginutils');

function ExamplePlugin(argv) {
	this.argv = argv;
	this.utils = new pluginutils("steamer-plugin-example");
}

ExamplePlugin.prototype.init = function() {
	console.log(this.argv);
};

ExamplePlugin.prototype.help = function() {
	this.utils.printUsage('steamer plugin example', 'example');
	this.utils.printOption([
		{
			option: "list",
			alias: "l",
			description: "list examples"
		},
	]);
};

module.exports = ExamplePlugin;