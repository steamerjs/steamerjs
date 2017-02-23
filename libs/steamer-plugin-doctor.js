"use strict";

/*
*   This plugin is going to check the node environment.
*   Right now we only check if NODE_PATH variable exists
 */

function DoctortPlugin(argv) {
	this.argv = argv;
}

DoctortPlugin.prototype.init = function() {
	if(process.env.NODE_PATH === undefined) {
		throw new Error("You must set NODE_PATH correctly!!! Now it's undefined\n You can visit https://github.com/SteamerTeam/steamerjs to see how to set NODE_PATH");
	}
};

module.exports = DoctortPlugin;
