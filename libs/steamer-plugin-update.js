"use strict";

const npmCheck = require('npm-check'),
	  semVer = require('semver'),
	  inquirer = require('inquirer'),
	  pluginUtils = require('steamer-pluginutils'),
	  spawn = require('cross-spawn');

var chalk = null;

function UpdatePlugin(argv) {
	this.argv = argv;
	this.utils = new pluginUtils("steamerjs");
	chalk = this.utils.chalk;
}

UpdatePlugin.description = "update steamerjs commands and starterkits";

UpdatePlugin.prototype.init = function() {

	this.config = this.utils.readSteamerConfig();
	this.npm = this.config.npm || 'npm';

	this.checkUpdate();
	
};

/**
 * check latest pkgs
 */
UpdatePlugin.prototype.checkUpdate = function() {

	process.env.NPM_CHECK_INSTALLER = this.npm;

	npmCheck({
		update: true,
		spinner: true,
		global: true,
		ignore: ["!steamer*"],
		installer: this.npm,
	}).then((currentState) => {
		let pacakges = currentState.get('packages');

		if (pacakges.length) {
			var updatePkgs = [];

			pacakges.forEach((item) => {
				if (semVer.lt(item.installed, item.latest)) {
					let updatePkg = {
						name: item.moduleName,
						oldVer: item.installed,
						latestVer: item.latest,
						homepage: item.homepage
					};
					updatePkgs.push(updatePkg);
				}
			});

			this.autoSelection(updatePkgs);
		}
	}); 
};

/**
 * interactive update
 */
UpdatePlugin.prototype.autoSelection = function(updatePkgs) {

	if (!updatePkgs.length) {
		this.utils.info("All plugins or starterkits are latest.");
		return;
	}

	this.utils.info("Following plugins or starterkits have latest versions:");

	let pkgs = [];

	updatePkgs.map((item, key) => {
		pkgs.push({
			name: chalk.yellow(item.name) + '  ' + chalk.white(item.oldVer) + ' > ' 
			      + chalk.white.bold(item.latestVer) + ' ' + chalk.blue(item.homepage),
			value: key
		});
	});

	inquirer.prompt([{
		type: 'checkbox',
		name: 'pkgs',
		message: 'Choose which packages to update.',
		choices: pkgs,
	}]).then((answers) => {
	    let pkgs = answers.pkgs || [];

	    this.startUpdate(updatePkgs, pkgs);

	}).catch((e) => {
		this.utils.error(e.stack);
	});
};

/**
 * start updating
 */
UpdatePlugin.prototype.startUpdate = function(updatePkgs, selectedPkgs) {
	let execStr = '';

	selectedPkgs.forEach((key) => {
		let item = updatePkgs[key];
		execStr += (item.name + '@' + item.latestVer + ' ');
	});

	if (execStr) {
		var result = spawn.sync(this.npm, ['install', '-g', execStr], { stdio: 'inherit' });
		
		if (result.error) {
			this.utils.error(result.error);
		}
	}
};

UpdatePlugin.prototype.help = function() {
	this.utils.printUsage("update steamerjs commands and starterkits", "update");
};

module.exports = UpdatePlugin;